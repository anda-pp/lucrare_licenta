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

// =============================================================================
// REGISTRU DE CONDIȚII PENTRU INSIGNE  —  sursă unică de adevăr
// -----------------------------------------------------------------------------
// Fiecare condiție are:
//   - label:       nume prietenos afișat în panoul de admin (dropdown)
//   - description: explicație scurtă a ce numără condiția
//   - evaluate:    (userId, target) => { score, achievedAt }
//
// Ca să adaugi un TIP NOU de condiție e suficient să adaugi o singură intrare
// aici. Va apărea automat în dropdown-ul din admin (via GET /admin/conditions)
// și va fi acceptată la crearea insignelor (validarea din POST /admin).
// =============================================================================
const BADGE_CONDITIONS = {
    reviews: {
        label: 'Recenzii scrise',
        description: 'Numărul total de recenzii lăsate de utilizator.',
        evaluate: async (userId, target) => {
            const rows = await db.all(sql`SELECT data_recenzie as dt FROM recenzii WHERE cod_unic_utilizator = ${userId} ORDER BY data_recenzie ASC`);
            return { score: rows.length, achievedAt: rows.length >= target ? parseDateToEpoch(rows[target - 1].dt) : null };
        },
    },
    perfect_rating: {
        label: 'Recenzii de 5 stele',
        description: 'Numărul de recenzii cu rating maxim (5 stele).',
        evaluate: async (userId, target) => {
            const rows = await db.all(sql`SELECT data_recenzie as dt FROM recenzii WHERE cod_unic_utilizator = ${userId} AND rating = 5 ORDER BY data_recenzie ASC`);
            return { score: rows.length, achievedAt: rows.length >= target ? parseDateToEpoch(rows[target - 1].dt) : null };
        },
    },
    orders: {
        label: 'Comenzi plătite',
        description: 'Numărul de comenzi finalizate (status „Plătit").',
        evaluate: async (userId, target) => {
            const rows = await db.all(sql`SELECT data_comanda as dt FROM comenzi WHERE cod_unic_utilizator = ${userId} AND status_plata = 'Plătit' ORDER BY data_comanda ASC`);
            return { score: rows.length, achievedAt: rows.length >= target ? parseDateToEpoch(rows[target - 1].dt) : null };
        },
    },
    museums: {
        label: 'Muzee vizitate',
        description: 'Numărul de locații distincte pentru care s-au cumpărat bilete.',
        evaluate: async (userId, target) => {
            const rows = await db.all(sql`
                SELECT MIN(c.data_comanda) as dt
                FROM comenzi c
                JOIN bilete_cumparate bc ON bc.numar_comanda = c.numar_comanda
                JOIN tipuri_bilete tb ON bc.cod_unic_tip_bilet = tb.cod_unic_tip_bilet
                WHERE c.cod_unic_utilizator = ${userId} AND c.status_plata = 'Plătit'
                GROUP BY tb.cod_unic_locatie
                ORDER BY dt ASC
            `);
            return { score: rows.length, achievedAt: rows.length >= target ? parseDateToEpoch(rows[target - 1].dt) : null };
        },
    },
    events: {
        label: 'Evenimente rezervate',
        description: 'Numărul de rezervări la evenimente.',
        evaluate: async (userId, target) => {
            const rows = await db.all(sql`SELECT data_rezervare as dt FROM rezervari_evenimente WHERE user_id = ${userId} ORDER BY data_rezervare ASC`);
            return { score: rows.length, achievedAt: rows.length >= target ? parseDateToEpoch(rows[target - 1].dt) : null };
        },
    },
    loyalty_gold: {
        label: 'Card fidelitate Gold/Platinum',
        description: 'Deține un card de fidelitate de nivel GOLD sau PLATINUM (condiție binară — target ignorat).',
        evaluate: async (userId) => {
            const rows = await db.all(sql`
                SELECT cc.nr_unic_card FROM carduri_clienti cc
                JOIN card_fidelitate cf ON cc.tip_unic_card = cf.tip_unic_card
                WHERE cc.cod_unic_utilizator = ${userId} AND cf.tip_unic_card IN ('GOLD','PLATINUM')
            `);
            return { score: rows.length, achievedAt: rows.length >= 1 ? Math.floor(Date.now() / 1000) : null };
        },
    },
    favorites_5: {
        label: 'Locații favorite',
        description: 'Numărul de locații adăugate la favorite.',
        evaluate: async (userId, target) => {
            const rows = await db.all(sql`SELECT data_adaugarii as dt FROM favorite_locatii WHERE cod_unic_utilizator = ${userId} ORDER BY data_adaugarii ASC`);
            return { score: rows.length, achievedAt: rows.length >= target ? parseDateToEpoch(rows[target - 1].dt) : null };
        },
    },
};

// Lista cheilor valide — folosită la validarea condiției primite de la admin
const VALID_CONDITIONS = Object.keys(BADGE_CONDITIONS);

// Evaluează condiția unei insigne pentru un utilizator, pe baza cheii badge.conditie
async function evaluateBadge(badge, userId) {
    const cond = BADGE_CONDITIONS[badge.conditie];
    if (!cond) return { score: 0, achievedAt: null };
    return cond.evaluate(userId, badge.valoare_conditie);
}

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
            const { score, achievedAt } = await evaluateBadge(badge, userId);
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

        const allBadges = await db.all(sql`SELECT * FROM insigne`);
        const newlyEarned = [];

        for (const badge of allBadges) {
            const existing = await db.all(sql`
                SELECT id FROM insigne_utilizatori WHERE user_id = ${userId} AND insigna_id = ${badge.id}
            `);
            if (existing.length > 0) continue;

            const { score, achievedAt } = await evaluateBadge(badge, userId);
            if (score >= badge.valoare_conditie) {
                const awardDate = achievedAt || Math.floor(Date.now() / 1000);
                await db.run(sql`
                    INSERT INTO insigne_utilizatori (id, user_id, insigna_id, data_obtinerii)
                    VALUES (${uuidv4()}, ${userId}, ${badge.id}, ${awardDate})
                `);
                newlyEarned.push(badge);
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

// GET /api/badges/admin/conditions - Lista condițiilor implementate în backend
// (folosită de admin pentru a popula dropdown-ul „Condiție Tehnică")
router.get('/admin/conditions', requireSuperadmin, (req, res) => {
    const data = Object.entries(BADGE_CONDITIONS).map(([conditie, meta]) => ({
        conditie,
        label: meta.label,
        description: meta.description,
    }));
    res.json({ success: true, data });
});

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

        // Nu permite crearea unei insigne cu o condiție care nu are implementare în backend
        if (!VALID_CONDITIONS.includes(conditie)) {
            return res.status(400).json({
                success: false,
                message: `Condiția "${conditie}" nu este implementată în backend. Alege una dintre: ${VALID_CONDITIONS.join(', ')}.`,
            });
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
