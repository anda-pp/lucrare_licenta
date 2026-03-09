import express from 'express';
import { db } from '../db/db.js';
import { sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(requireAuth);

// All badge conditions and their DB queries
const BADGE_DEFINITIONS = [
    {
        id: 'b_reviews_5',
        conditie: 'reviews_5',
        valoareConditie: 5,
        getScore: async (userId) => {
            const r = await db.run(sql`SELECT COUNT(*) as cnt FROM recenzii WHERE cod_unic_utilizator = ${userId}`);
            return r.rows[0]?.cnt ?? 0;
        }
    },
    {
        id: 'b_reviews_1_rating5',
        conditie: 'rating_5',
        valoareConditie: 1,
        getScore: async (userId) => {
            const r = await db.run(sql`SELECT COUNT(*) as cnt FROM recenzii WHERE cod_unic_utilizator = ${userId} AND rating = 5`);
            return r.rows[0]?.cnt ?? 0;
        }
    },
    {
        id: 'b_orders_10',
        conditie: 'orders_10',
        valoareConditie: 10,
        getScore: async (userId) => {
            const r = await db.run(sql`SELECT COUNT(*) as cnt FROM comenzi WHERE cod_unic_utilizator = ${userId} AND status_plata = 'Plătit'`);
            return r.rows[0]?.cnt ?? 0;
        }
    },
    {
        id: 'b_museums_3',
        conditie: 'museums_3',
        valoareConditie: 3,
        getScore: async (userId) => {
            // Count distinct locations from paid orders via tickets
            const r = await db.run(sql`
                SELECT COUNT(DISTINCT bc.cod_unic_locatie) as cnt
                FROM comenzi c
                JOIN bilete_cumparate bc ON bc.numar_comanda = c.numar_comanda
                WHERE c.cod_unic_utilizator = ${userId} AND c.status_plata = 'Plătit'
            `);
            return r.rows[0]?.cnt ?? 0;
        }
    },
    {
        id: 'b_events_3',
        conditie: 'events_3',
        valoareConditie: 3,
        getScore: async (userId) => {
            const r = await db.run(sql`SELECT COUNT(*) as cnt FROM rezervari_evenimente WHERE user_id = ${userId}`);
            return r.rows[0]?.cnt ?? 0;
        }
    },
    {
        id: 'b_loyalty_gold',
        conditie: 'loyalty_gold',
        valoareConditie: 1,
        getScore: async (userId) => {
            const r = await db.run(sql`
                SELECT COUNT(*) as cnt FROM carduri_clienti cc
                JOIN card_fidelitate cf ON cc.tip_unic_card = cf.tip_unic_card
                WHERE cc.cod_unic_utilizator = ${userId} AND cf.tip_unic_card IN ('GOLD','PLATINUM')
            `);
            return r.rows[0]?.cnt ?? 0;
        }
    },
    {
        id: 'b_favorites_5',
        conditie: 'favorites_5',
        valoareConditie: 5,
        getScore: async (userId) => {
            const r = await db.run(sql`SELECT COUNT(*) as cnt FROM favorite_locatii WHERE cod_unic_utilizator = ${userId}`);
            return r.rows[0]?.cnt ?? 0;
        }
    },
];

// GET /api/badges/my — insignele utilizatorului + toate disponibile
router.get('/my', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'Neautentificat' });

        // All badges in catalog
        const allBadges = await db.run(sql`SELECT * FROM insigne ORDER BY valoare_conditie ASC`);

        // Earned by this user
        const earned = await db.run(sql`
            SELECT iu.insigna_id, iu.data_obtinerii FROM insigne_utilizatori iu
            WHERE iu.user_id = ${userId}
        `);
        const earnedMap = new Map(earned.rows.map(r => [r.insigna_id, r.data_obtinerii]));

        // Current progress for each badge
        const result = [];
        for (const badge of allBadges.rows) {
            const def = BADGE_DEFINITIONS.find(d => d.id === badge.id);
            const score = def ? await def.getScore(userId) : 0;
            const isEarned = earnedMap.has(badge.id);
            result.push({
                ...badge,
                earned: isEarned,
                dataObtinerii: isEarned ? earnedMap.get(badge.id) : null,
                progres: Math.min(score, badge.valoare_conditie),
            });
        }

        res.json({ success: true, data: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Eroare server' });
    }
});

// POST /api/badges/check — rulează verificarea și acordă insigne noi
router.post('/check', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'Neautentificat' });

        const newlyEarned = [];

        for (const def of BADGE_DEFINITIONS) {
            // Check if already earned
            const existing = await db.run(sql`
                SELECT id FROM insigne_utilizatori WHERE user_id = ${userId} AND insigna_id = ${def.id}
            `);
            if (existing.rows.length > 0) continue;

            const score = await def.getScore(userId);
            if (score >= def.valoareConditie) {
                // Award the badge
                await db.run(sql`
                    INSERT INTO insigne_utilizatori (id, user_id, insigna_id, data_obtinerii)
                    VALUES (${uuidv4()}, ${userId}, ${def.id}, ${Math.floor(Date.now() / 1000)})
                `);
                const badge = await db.run(sql`SELECT * FROM insigne WHERE id = ${def.id}`);
                if (badge.rows[0]) newlyEarned.push(badge.rows[0]);
            }
        }

        res.json({ success: true, data: newlyEarned, count: newlyEarned.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Eroare server' });
    }
});

export default router;
