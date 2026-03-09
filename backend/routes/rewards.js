import express from 'express';
import { db } from '../db/db.js';
import { sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(requireAuth);

// GET /api/rewards — catalog recompense + punctele curente ale userului
router.get('/', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'Neautentificat' });

        // All active rewards
        const rewards = await db.run(sql`
            SELECT * FROM recompense WHERE activ = 1 ORDER BY puncte_necesare ASC
        `);

        // User's current points from loyalty card
        const cardData = await db.run(sql`
            SELECT cc.puncte_acumulate, cf.tip_unic_card, cf.nume_card
            FROM carduri_clienti cc
            JOIN card_fidelitate cf ON cc.tip_unic_card = cf.tip_unic_card
            WHERE cc.cod_unic_utilizator = ${userId}
        `);
        const puncte = cardData.rows[0]?.puncte_acumulate ?? 0;
        const card = cardData.rows[0] ?? null;

        res.json({ success: true, data: rewards.rows, puncteCurente: puncte, card });
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

        const claimed = await db.run(sql`
            SELECT rr.*, r.nume, r.descriere, r.tip, r.valoare, r.puncte_necesare
            FROM recompense_revendicate rr
            JOIN recompense r ON rr.recompensa_id = r.id
            WHERE rr.user_id = ${userId}
            ORDER BY rr.data_revendicarii DESC
        `);

        res.json({ success: true, data: claimed.rows });
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
        const rewardRes = await db.run(sql`SELECT * FROM recompense WHERE id = ${recompensaId} AND activ = 1`);
        const reward = rewardRes.rows[0];
        if (!reward) return res.status(404).json({ success: false, message: 'Recompensa nu există' });

        // Get user card
        const cardRes = await db.run(sql`
            SELECT cc.nr_unic_card, cc.puncte_acumulate
            FROM carduri_clienti cc
            WHERE cc.cod_unic_utilizator = ${userId}
        `);
        const card = cardRes.rows[0];
        if (!card) return res.status(400).json({ success: false, message: 'Nu ai un card de fidelitate activ' });

        if (card.puncte_acumulate < reward.puncte_necesare) {
            return res.status(400).json({
                success: false,
                message: `Nu ai suficiente puncte. Ai ${card.puncte_acumulate}, dar sunt necesare ${reward.puncte_necesare}.`
            });
        }

        // Deduct points
        await db.run(sql`
            UPDATE carduri_clienti
            SET puncte_acumulate = puncte_acumulate - ${reward.puncte_necesare}
            WHERE nr_unic_card = ${card.nr_unic_card}
        `);

        // Generate voucher code
        const codVoucher = `${reward.tip?.toUpperCase().slice(0, 3) ?? 'VOC'}-${uuidv4().slice(0, 8).toUpperCase()}`;

        await db.run(sql`
            INSERT INTO recompense_revendicate (id, user_id, recompensa_id, data_revendicarii, status, cod_voucher, puncte_cheltuite)
            VALUES (${uuidv4()}, ${userId}, ${recompensaId}, ${Math.floor(Date.now() / 1000)}, 'activ', ${codVoucher}, ${reward.puncte_necesare})
        `);

        res.json({ success: true, data: { codVoucher, reward }, message: 'Recompensă revendicată cu succes!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Eroare server' });
    }
});

export default router;
