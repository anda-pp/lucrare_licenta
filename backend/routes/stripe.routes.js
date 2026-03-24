import express from 'express';
import Stripe from 'stripe';
import { requireAuth } from '../middleware/authMiddleware.js';
import { db } from '../db/db.js';
import {
    comenzi, bileteCumparate, facturi,
    recompenzeRevendicate, recompense, tipuriBilete
} from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { updateUserLoyaltyPoints } from '../services/loyaltyPoints.service.js';

const router = express.Router();

// Lazy init — dotenv loads after ESM imports are hoisted
let _stripe;
function getStripe() {
    if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    return _stripe;
}

/**
 * POST /api/stripe/create-payment-intent
 * Creates a PaymentIntent and returns clientSecret for embedded Stripe Elements
 */
router.post('/create-payment-intent', requireAuth, async (req, res) => {
    try {
        const { locationId, tickets, promoCode } = req.body;

        if (!locationId || !tickets || tickets.length === 0) {
            return res.status(400).json({ success: false, error: 'Date invalide' });
        }

        // Calculate total from DB prices (server-side, tamper-proof)
        let totalBani = 0;
        const validTickets = [];

        for (const t of tickets) {
            if (t.cantitate > 0) {
                const ticketType = await db.select().from(tipuriBilete)
                    .where(eq(tipuriBilete.codUnicTipBilet, t.codUnicTipBilet))
                    .limit(1);

                if (ticketType.length === 0) continue;
                const tt = ticketType[0];
                totalBani += Math.round(parseFloat(tt.pret) * 100) * t.cantitate;
                validTickets.push({ ...t, pret: tt.pret, tipBilet: tt.tipBilet });
            }
        }

        if (totalBani === 0) {
            return res.status(400).json({ success: false, error: 'Nu au fost găsite bilete valide' });
        }

        // Apply promo discount if present
        let promoDetails = null;
        if (promoCode) {
            const voucherRes = await db.select({
                id: recompenzeRevendicate.id,
                valoare: recompense.valoare,
                dataRevendicarii: recompenzeRevendicate.dataRevendicarii,
                tip: recompense.tip
            })
                .from(recompenzeRevendicate)
                .leftJoin(recompense, eq(recompenzeRevendicate.recompensaId, recompense.id))
                .where(
                    and(
                        eq(recompenzeRevendicate.codVoucher, promoCode),
                        eq(recompenzeRevendicate.userId, req.user.id),
                        eq(recompenzeRevendicate.status, 'activ')
                    )
                )
                .limit(1);

            if (voucherRes.length === 0) {
                return res.status(400).json({ success: false, error: 'Cod promoțional invalid.' });
            }

            const voucher = voucherRes[0];
            const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
            if (voucher.dataRevendicarii < thirtyDaysAgo) {
                await db.update(recompenzeRevendicate)
                    .set({ status: 'expirat' })
                    .where(eq(recompenzeRevendicate.id, voucher.id));
                return res.status(400).json({ success: false, error: 'Codul promoțional a expirat.' });
            }

            promoDetails = voucher;
            const valoare = parseFloat(voucher.valoare) || 0;

            if (voucher.tip === 'reducere' || voucher.tip === 'Procentaj' || voucher.tip === 'reducere_%') {
                totalBani = Math.round(totalBani * (1 - valoare / 100));
            } else if (voucher.tip === 'voucher' || voucher.tip === 'SumaFixa' || voucher.tip === 'reducere_fixa') {
                totalBani = Math.max(0, totalBani - Math.round(valoare * 100));
            } else if (voucher.tip === 'bilet_gratuit' || voucher.tip === 'Gratuitate') {
                totalBani = 0;
            }
        }

        // Minimum 50 bani (Stripe requirement)
        if (totalBani < 50) totalBani = 50;

        // Create PaymentIntent
        const paymentIntent = await getStripe().paymentIntents.create({
            amount: totalBani,
            currency: 'ron',
            automatic_payment_methods: { enabled: true },
            metadata: {
                userId: req.user.id,
                locationId,
                tickets: JSON.stringify(validTickets),
                promoCode: promoCode || '',
                promoId: promoDetails?.id || '',
            },
        });

        res.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            totalBani,
        });
    } catch (error) {
        console.error('Stripe create-payment-intent error:', error);
        res.status(500).json({ success: false, error: 'Eroare la crearea intenției de plată' });
    }
});

/**
 * POST /api/stripe/webhook
 * Handles Stripe events — creates the order after successful PaymentIntent confirmation
 * Must use raw body (express.raw) — configured in server.js
 */
router.post('/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = getStripe().webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature error:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
        const pi = event.data.object;
        const meta = pi.metadata;

        try {
            const userId = meta.userId;
            const tickets = JSON.parse(meta.tickets || '[]');
            const promoId = meta.promoId;
            const finalTotal = pi.amount / 100;

            // 1. Create Order
            const [newOrder] = await db.insert(comenzi).values({
                codUnicUtilizator: userId,
                totalPlata: finalTotal,
                statusPlata: 'Plătit',
                statusComanda: 'Activă',
            }).returning({ id: comenzi.numarComanda });

            // 2. Insert Tickets
            const ticketInserts = tickets
                .filter(t => t.cantitate > 0)
                .map(t => ({
                    nrBiletCumparat: uuidv4(),
                    codUnicTipBilet: t.codUnicTipBilet,
                    numarComanda: newOrder.id,
                    cantitate: t.cantitate,
                }));

            if (ticketInserts.length > 0) {
                await db.insert(bileteCumparate).values(ticketInserts);
            }

            // 3. Create Invoice
            const serie = 'FCT-' + Math.floor(Math.random() * 10000);
            await db.insert(facturi).values({
                numarComanda: newOrder.id,
                serieFactura: serie,
                dataFacturare: new Date().toISOString().split('T')[0],
                tva: 0.19,
                totalFactura: finalTotal,
            });

            // 4. Award loyalty points (1 RON = 1 punct, auto-upgrade card tier)
            if (finalTotal > 0) {
                await updateUserLoyaltyPoints(userId, finalTotal);
            }

            // 5. Mark promo code as used
            if (promoId) {
                await db.update(recompenzeRevendicate)
                    .set({ status: 'folosit' })
                    .where(eq(recompenzeRevendicate.id, promoId));
            }

            console.log(`✅ Order ${newOrder.id} created from PaymentIntent ${pi.id}`);
        } catch (err) {
            console.error('Error processing webhook order:', err);
            return res.status(500).json({ error: 'Eroare la procesarea comenzii' });
        }
    }

    res.json({ received: true });
});

export default router;
