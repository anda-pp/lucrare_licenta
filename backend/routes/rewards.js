import express from 'express';
import { db } from '../db/db.js';
import { sql, eq, desc, gte } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { recompense, recompenzeRevendicate, user, carduriClienti } from '../db/schema.js';
import { requireAuth, requireSuperadmin } from '../middleware/authMiddleware.js';
import { sendNewRewardAvailable } from '../lib/mailer.js';

const router = express.Router();
router.use(requireAuth);

// GET /api/rewards — catalog recompense + punctele curente ale userului
router.get('/', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'Neautentificat' });

        const rewards = await db.all(sql`
            SELECT * FROM recompense
            ORDER BY activ DESC, puncte_necesare ASC
        `);

        // User's current points from loyalty card
        const cardData = await db.get(sql`
            SELECT cc.puncte_acumulate, cf.tip_unic_card, cf.nume_card
            FROM carduri_clienti cc
            JOIN card_fidelitate cf ON cc.tip_unic_card = cf.tip_unic_card
            WHERE cc.cod_unic_utilizator = ${userId}
        `);
        const puncte = cardData?.puncte_acumulate ?? 0;
        const card = cardData ?? null;

        res.json({ success: true, data: rewards, puncteCurente: puncte, card });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Eroare server' });
    }
});

// GET /api/rewards/my — recompensele revendicate de user
router.get('/my', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'Neautentificat' });

        const claimed = await db.all(sql`
            SELECT rr.*, r.nume, r.descriere, r.tip, r.valoare, r.puncte_necesare
            FROM recompense_revendicate rr
            JOIN recompense r ON rr.recompensa_id = r.id
            WHERE rr.user_id = ${userId}
            ORDER BY rr.data_revendicarii DESC
        `);

        res.json({ success: true, data: claimed });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Eroare server' });
    }
});

// POST /api/rewards/:id/claim — revendică o recompensă
router.post('/:id/claim', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'Neautentificat' });
        const recompensaId = req.params.id;

        // Get reward
        const reward = await db.get(sql`SELECT * FROM recompense WHERE id = ${recompensaId} AND activ = 1`);
        if (!reward) return res.status(404).json({ success: false, message: 'Recompensa nu există' });

        // Get user card
        const card = await db.get(sql`
            SELECT cc.nr_unic_card, cc.puncte_acumulate
            FROM carduri_clienti cc
            WHERE cc.cod_unic_utilizator = ${userId}
        `);
        if (!card) return res.status(400).json({ success: false, message: 'Nu ai un card de fidelitate activ' });

        // Check if the user claimed this EXACT reward in the last 30 days
        const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);

        const lastClaim = await db.get(sql`
            SELECT data_revendicarii 
            FROM recompense_revendicate 
            WHERE user_id = ${userId} AND recompensa_id = ${recompensaId}
            ORDER BY data_revendicarii DESC 
            LIMIT 1
        `);

        if (lastClaim && lastClaim.data_revendicarii > thirtyDaysAgo) {
            const daysLeft = Math.ceil((lastClaim.data_revendicarii - thirtyDaysAgo) / (24 * 60 * 60));
            return res.status(400).json({
                success: false,
                message: `Ai revendicat deja această recompensă recent. Te rugăm să aștepți încă ${daysLeft} zile.`
            });
        }

        if (card.puncte_acumulate < reward.puncte_necesare) {
            return res.status(400).json({
                success: false,
                message: `Nu ai suficiente puncte.Ai ${card.puncte_acumulate}, dar sunt necesare ${reward.puncte_necesare}.`
            });
        }

        // Deduct points
        await db.run(sql`
            UPDATE carduri_clienti
            SET puncte_acumulate = puncte_acumulate - ${reward.puncte_necesare}
            WHERE nr_unic_card = ${card.nr_unic_card}
                `);

        // Generate voucher code (e.g. ARTS-X9F2)
        const prefix = reward.tip?.toUpperCase().slice(0, 3) || 'PRM';
        const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
        const codVoucher = `${prefix} - ${randomPart}`;

        await db.run(sql`
            INSERT INTO recompense_revendicate(id, user_id, recompensa_id, data_revendicarii, status, cod_voucher, puncte_cheltuite)
            VALUES(${uuidv4()}, ${userId}, ${recompensaId}, ${Math.floor(Date.now() / 1000)}, 'activ', ${codVoucher}, ${reward.puncte_necesare})
                    `);

        res.json({ success: true, data: { codVoucher, reward }, message: 'Recompensă revendicată cu succes!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Eroare server' });
    }
});

// ==========================================
// ADMIN ROUTES (CRUD RECOMPENSE)
// ==========================================

// POST /api/rewards — Creare recompensă nouă (Doar Admin)
router.post('/', requireSuperadmin, async (req, res) => {
    try {
        const { nume, descriere, puncteNecesare, tip } = req.body;
        const valoare = parseFloat(req.body.valoare) || 0;

        if (!nume || !puncteNecesare) {
            return res.status(400).json({ success: false, message: 'Numele și punctele necesare sunt obligatorii.' });
        }

        const newId = uuidv4();
        await db.run(sql`
            INSERT INTO recompense(id, nume, descriere, puncte_necesare, tip, valoare, activ)
            VALUES(${newId}, ${nume}, ${descriere}, ${puncteNecesare}, ${tip}, ${valoare}, 1)
                    `);

        res.status(201).json({ success: true, message: 'Recompensă creată cu succes', data: { id: newId } });

        // Notify users who have enough points (fire-and-forget)
        (async () => {
            try {
                const eligibleUsers = await db.select({ email: user.email, puncte: carduriClienti.puncteAcumulate })
                    .from(carduriClienti)
                    .leftJoin(user, eq(carduriClienti.codUnicUtilizator, user.id))
                    .where(gte(carduriClienti.puncteAcumulate, puncteNecesare));
                for (const u of eligibleUsers) {
                    if (!u.email) continue;
                    await sendNewRewardAvailable(u.email, {
                        rewardName: nume,
                        rewardDescription: descriere || '',
                        pointsCost: puncteNecesare,
                        userPoints: u.puncte,
                    }).catch(e => console.error(`Reward email to ${u.email} failed:`, e.message));
                }
            } catch (e) { console.error('New reward notification error:', e.message); }
        })();
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Eroare la crearea recompensei' });
    }
});

// PUT /api/rewards/:id — Editare recompensă (Doar Admin)
router.put('/:id', requireSuperadmin, async (req, res) => {
    try {
        const { nume, descriere, puncteNecesare, tip, activ } = req.body;
        const valoare = parseFloat(req.body.valoare) || 0;
        const rewardId = req.params.id;

        await db.run(sql`
            UPDATE recompense
            SET nume = ${nume},
                descriere = ${descriere},
                puncte_necesare = ${puncteNecesare},
                tip = ${tip},
                valoare = ${valoare},
                activ = ${activ ? 1 : 0}
            WHERE id = ${rewardId}
                `);

        res.json({ success: true, message: 'Recompensă actualizată cu succes' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Eroare la actualizarea recompensei' });
    }
});

// DELETE /api/rewards/:id — Ștergere/Dezactivare recompensă (Doar Admin)
router.delete('/:id', requireSuperadmin, async (req, res) => {
    try {
        const rewardId = req.params.id;

        // În loc să ștergem fizic (ceea ce ar putea rupe istoricul recompense_revendicate),
        // o marcăm ca inactivă (soft delete).
        await db.update(recompense)
            .set({ activ: false })
            .where(eq(recompense.id, rewardId));

        res.json({ success: true, message: 'Recompensă dezactivată cu succes' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Eroare la dezactivarea recompensei' });
    }
});

// GET /api/rewards/admin/claims — Istoric recompense revendicate (Doar Admin)
router.get('/admin/claims', requireSuperadmin, async (req, res) => {
    try {
        const claims = await db.select({
            id: recompenzeRevendicate.id,
            user_id: recompenzeRevendicate.userId,
            recompensa_id: recompenzeRevendicate.recompensaId,
            data_revendicarii: recompenzeRevendicate.dataRevendicarii,
            status: recompenzeRevendicate.status,
            cod_voucher: recompenzeRevendicate.codVoucher,
            puncte_cheltuite: recompenzeRevendicate.puncteCheltuite,
            nume: recompense.nume,
            tip: recompense.tip,
            valoare: recompense.valoare,
            nume_complet: user.name,
            email: user.email
        })
            .from(recompenzeRevendicate)
            .leftJoin(recompense, eq(recompenzeRevendicate.recompensaId, recompense.id))
            .leftJoin(user, eq(recompenzeRevendicate.userId, user.id))
            .orderBy(desc(recompenzeRevendicate.dataRevendicarii));

        res.json({ success: true, data: claims });
    } catch (err) {
        console.error('Admin Claims error:', err);
        res.status(500).json({ success: false, message: 'Eroare la preluarea istoricului de revendicări' });
    }
});

export default router;
