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

// Inițializăm Stripe lazy — variabilele de mediu nu sunt disponibile înainte ca ESM să fie hoisted
let _stripe;
function getStripe() {
    if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    return _stripe;
}

// Creează un PaymentIntent Stripe și returnează clientSecret pentru Stripe Elements
// Prețurile se calculează server-side din DB — nu putem lăsa clientul să dicteze suma
router.post('/create-payment-intent', requireAuth, async (req, res) => {
    try {
        const { locationId, tickets, promoCode, dataVizita } = req.body;

        if (!locationId || !tickets || tickets.length === 0) {
            return res.status(400).json({ success: false, error: 'Date invalide' });
        }

        // Calculăm totalul din prețurile din DB (în bani, pentru Stripe)
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

        // Aplicăm discountul din codul promoțional dacă există
        // Verificăm și că voucherul nu a expirat (maxim 30 de zile de la revendicare)
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

            // Aplicăm tipul de reducere: procentaj, sumă fixă sau gratuitate totală
            if (voucher.tip === 'reducere' || voucher.tip === 'Procentaj' || voucher.tip === 'reducere_%') {
                totalBani = Math.round(totalBani * (1 - valoare / 100));
            } else if (voucher.tip === 'voucher' || voucher.tip === 'SumaFixa' || voucher.tip === 'reducere_fixa') {
                totalBani = Math.max(0, totalBani - Math.round(valoare * 100));
            } else if (voucher.tip === 'bilet_gratuit' || voucher.tip === 'Gratuitate') {
                totalBani = 0;
            }
        }

        // Stripe necesită minimum 50 de bani pentru un PaymentIntent
        if (totalBani < 50) totalBani = 50;

        // Metadatele PaymentIntent sunt folosite de webhook la procesarea comenzii
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
                dataVizita: dataVizita || '',
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

// Webhook Stripe — procesează evenimentele asincron după confirmarea plății
// Folosește body raw (configurat în server.js) pentru verificarea semnăturii Stripe
// La payment_intent.succeeded: creăm comanda, biletele, factura, acordăm puncte și marcăm voucherul folosit
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
            const dataVizita = meta.dataVizita || null;
            const finalTotal = pi.amount / 100;

            // 1. Creăm comanda cu status Plătit
            const [newOrder] = await db.insert(comenzi).values({
                codUnicUtilizator: userId,
                totalPlata: finalTotal,
                statusPlata: 'Plătit',
                statusComanda: 'Activă',
            }).returning({ id: comenzi.numarComanda });

            // 2. Inserăm biletele cumpărate legate de comandă
            const ticketInserts = tickets
                .filter(t => t.cantitate > 0)
                .map(t => ({
                    nrBiletCumparat: uuidv4(),
                    codUnicTipBilet: t.codUnicTipBilet,
                    numarComanda: newOrder.id,
                    cantitate: t.cantitate,
                    dataVizita: dataVizita || null,
                }));

            if (ticketInserts.length > 0) {
                await db.insert(bileteCumparate).values(ticketInserts);
            }

            // 3. Generăm factura automată
            const serie = 'FCT-' + Math.floor(Math.random() * 10000);
            await db.insert(facturi).values({
                numarComanda: newOrder.id,
                serieFactura: serie,
                dataFacturare: new Date().toISOString().split('T')[0],
                tva: 0.19,
                totalFactura: finalTotal,
            });

            // 4. Acordăm puncte de fidelitate și upgradăm cardul dacă e cazul
            if (finalTotal > 0) {
                await updateUserLoyaltyPoints(userId, finalTotal);
            }

            // 5. Marcăm voucherul ca folosit pentru a preveni reutilizarea
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
