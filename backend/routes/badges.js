import express from 'express';
import { db } from '../db/db.js';
import { sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth, requireSuperadmin } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(requireAuth);

const parseDateToEpoch = (dateVal) => {
    if (!dateVal) return null;
    if (typeof dateVal === 'number') return dateVal > 9999999999 ? Math.floor(dateVal / 1000) : dateVal;
    if (dateVal instanceof Date) return Math.floor(dateVal.getTime() / 1000);
    return Math.floor(new Date(dateVal).getTime() / 1000);
};

// All badge conditions and their DB queries
const BADGE_DEFINITIONS = [
    {
        id: 'b_reviews_5',
        conditie: 'reviews_5',
        valoareConditie: 5,
        getScore: async (userId) => {
            const rows = await db.all(sql`SELECT data_recenzie as dt FROM recenzii WHERE cod_unic_utilizator = ${userId} ORDER BY data_recenzie ASC`);
            return { score: rows.length, achievedAt: rows.length >= 5 ? parseDateToEpoch(rows[4].dt) : null };
        }
    },
    {
        id: 'b_reviews_1_rating5',
        conditie: 'rating_5',
        valoareConditie: 1,
        getScore: async (userId) => {
            const rows = await db.all(sql`SELECT data_recenzie as dt FROM recenzii WHERE cod_unic_utilizator = ${userId} AND rating = 5 ORDER BY data_recenzie ASC`);
            return { score: rows.length, achievedAt: rows.length >= 1 ? parseDateToEpoch(rows[0].dt) : null };
        }
    },
    {
        id: 'b_orders_10',
        conditie: 'orders_10',
        valoareConditie: 10,
        getScore: async (userId) => {
            const rows = await db.all(sql`SELECT data_comanda as dt FROM comenzi WHERE cod_unic_utilizator = ${userId} AND status_plata = 'Plătit' ORDER BY data_comanda ASC`);
            return { score: rows.length, achievedAt: rows.length >= 10 ? parseDateToEpoch(rows[9].dt) : null };
        }
    },
    {
        id: 'b_museums_3',
        conditie: 'museums_3',
        valoareConditie: 3,
        getScore: async (userId) => {
            const rows = await db.all(sql`
                SELECT MIN(c.data_comanda) as dt
                FROM comenzi c
                JOIN bilete_cumparate bc ON bc.numar_comanda = c.numar_comanda
                JOIN tipuri_bilete tb ON bc.cod_unic_tip_bilet = tb.cod_unic_tip_bilet
                WHERE c.cod_unic_utilizator = ${userId} AND c.status_plata = 'Plătit'
                GROUP BY tb.cod_unic_locatie
                ORDER BY dt ASC
            `);
            return { score: rows.length, achievedAt: rows.length >= 3 ? parseDateToEpoch(rows[2].dt) : null };
        }
    },
    {
        id: 'b_events_3',
        conditie: 'events_3',
        valoareConditie: 3,
        getScore: async (userId) => {
            const rows = await db.all(sql`SELECT data_rezervare as dt FROM rezervari_evenimente WHERE user_id = ${userId} ORDER BY data_rezervare ASC`);
            return { score: rows.length, achievedAt: rows.length >= 3 ? parseDateToEpoch(rows[2].dt) : null };
        }
    },
    {
        id: 'b_loyalty_gold',
        conditie: 'loyalty_gold',
        valoareConditie: 1,
        getScore: async (userId) => {
            const rows = await db.all(sql`
                SELECT cc.nr_unic_card FROM carduri_clienti cc
                JOIN card_fidelitate cf ON cc.tip_unic_card = cf.tip_unic_card
                WHERE cc.cod_unic_utilizator = ${userId} AND cf.tip_unic_card IN ('GOLD','PLATINUM')
            `);
            return { score: rows.length, achievedAt: rows.length >= 1 ? Math.floor(Date.now() / 1000) : null };
        }
    },
    {
        id: 'b_favorites_5',
        conditie: 'favorites_5',
        valoareConditie: 5,
        getScore: async (userId) => {
            const rows = await db.all(sql`SELECT data_adaugarii as dt FROM favorite_locatii WHERE cod_unic_utilizator = ${userId} ORDER BY data_adaugarii ASC`);
            return { score: rows.length, achievedAt: rows.length >= 5 ? parseDateToEpoch(rows[4].dt) : null };
        }
    },
];

// GET /api/badges/my — insignele utilizatorului + toate disponibile
router.get('/my', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'Neautentificat' });

        // All badges in catalog
        const allBadges = await db.all(sql`SELECT * FROM insigne ORDER BY valoare_conditie ASC`);

        // Earned by this user
        const earned = await db.all(sql`
            SELECT iu.insigna_id, iu.data_obtinerii FROM insigne_utilizatori iu
            WHERE iu.user_id = ${userId}
        `);
        const earnedMap = new Map(earned.map(r => [r.insigna_id, r.data_obtinerii]));

        // Current progress for each badge & Auto-Award logical check
        const result = [];
        const newlyEarned = [];

        for (const badge of allBadges) {
            const def = BADGE_DEFINITIONS.find(d => d.id === badge.id);
            const { score, achievedAt } = def ? await def.getScore(userId) : { score: 0, achievedAt: null };
            let isEarned = earnedMap.has(badge.id);
            let badgeDate = isEarned ? earnedMap.get(badge.id) : null;

            // Auto-award if not earned but criteria met
            if (!isEarned && score >= badge.valoare_conditie) {
                const awardDate = achievedAt || Math.floor(Date.now() / 1000);
                await db.run(sql`
                    INSERT INTO insigne_utilizatori (id, user_id, insigna_id, data_obtinerii)
                    VALUES (${uuidv4()}, ${userId}, ${badge.id}, ${awardDate})
                `);
                isEarned = true;
                badgeDate = awardDate;
                newlyEarned.push({ ...badge, dataObtinerii: awardDate });
            }

            result.push({
                ...badge,
                earned: isEarned,
                dataObtinerii: badgeDate,
                progres: Math.min(score, badge.valoare_conditie),
            });
        }

        res.json({ success: true, data: result, newlyEarned: newlyEarned.length > 0 ? newlyEarned : undefined });
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
            const existing = await db.all(sql`
                SELECT id FROM insigne_utilizatori WHERE user_id = ${userId} AND insigna_id = ${def.id}
            `);
            if (existing.length > 0) continue;

            const score = await def.getScore(userId);
            if (score >= def.valoareConditie) {
                // Award the badge
                await db.run(sql`
                    INSERT INTO insigne_utilizatori (id, user_id, insigna_id, data_obtinerii)
                    VALUES (${uuidv4()}, ${userId}, ${def.id}, ${Math.floor(Date.now() / 1000)})
                `);
                const badge = await db.get(sql`SELECT * FROM insigne WHERE id = ${def.id}`);
                if (badge) newlyEarned.push(badge);
            }
        }

        res.json({ success: true, data: newlyEarned, count: newlyEarned.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Eroare server' });
    }
});

// ==========================================
// ADMIN ROUTES (CRUD INSIGNE)
// ==========================================

// GET /api/badges/admin - Obține catalogul complet pentru admin
router.get('/admin', requireSuperadmin, async (req, res) => {
    try {
        const badges = await db.all(sql`SELECT * FROM insigne ORDER BY valoare_conditie ASC`);
        res.json({ success: true, data: badges });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Eroare la preluarea insignelor' });
    }
});

// POST /api/badges/admin - Adăugare insignă nouă (doar vizual/catalog)
router.post('/admin', requireSuperadmin, async (req, res) => {
    try {
        const { id, nume, descriere, iconita, conditie, valoareConditie, culoare, mesajMotivatie } = req.body;

        if (!id || !nume || !conditie || valoareConditie === undefined) {
            return res.status(400).json({ success: false, message: 'Câmpurile obligatorii lipsesc.' });
        }

        await db.run(sql`
            INSERT INTO insigne (id, nume, descriere, iconita, conditie, valoare_conditie, culoare, mesaj_motivatie)
            VALUES (${id}, ${nume}, ${descriere}, ${iconita}, ${conditie}, ${valoareConditie}, ${culoare}, ${mesajMotivatie})
        `);

        res.status(201).json({ success: true, message: 'Insignă creată cu succes', data: { id } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Eroare la crearea insignei (posibil ID duplicat)' });
    }
});

// PUT /api/badges/admin/:id - Editare insignă existentă
router.put('/admin/:id', requireSuperadmin, async (req, res) => {
    try {
        const { nume, descriere, iconita, conditie, valoareConditie, culoare, mesajMotivatie } = req.body;
        const badgeId = req.params.id;

        await db.run(sql`
            UPDATE insigne
            SET nume = ${nume},
                descriere = ${descriere},
                iconita = ${iconita},
                conditie = ${conditie},
                valoare_conditie = ${valoareConditie},
                culoare = ${culoare},
                mesaj_motivatie = ${mesajMotivatie}
            WHERE id = ${badgeId}
        `);

        res.json({ success: true, message: 'Insignă actualizată cu succes' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Eroare la actualizarea insignei' });
    }
});

// DELETE /api/badges/admin/:id - Ștergere insignă din catalog
router.delete('/admin/:id', requireSuperadmin, async (req, res) => {
    try {
        const badgeId = req.params.id;

        // Dacă ștergem insigna, se vor șterge și înregistrările utilizatorilor (datorită CASCADE logic în schema)
        await db.run(sql`
            DELETE FROM insigne WHERE id = ${badgeId}
        `);

        res.json({ success: true, message: 'Insignă ștearsă cu succes' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Eroare la ștergerea insignei' });
    }
});

export default router;
