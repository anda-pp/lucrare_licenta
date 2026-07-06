import express from 'express';
import { getStaffDashboard } from '../controllers/staff.controller.js';
import { requireAuth, requireStaff } from '../middleware/authMiddleware.js';
import { db } from '../db/db.js';
import { user, recenzii, evenimente, rezervariEvenimente, comenzi, bileteCumparate, tipuriBilete, carduriClienti, cardFidelitate } from '../db/schema.js';
import { eq, sql, desc, and } from 'drizzle-orm';

const router = express.Router();

router.use(requireAuth);
router.use(requireStaff);

// ── Middleware: preia muzeuId din DB pentru userul curent ──────────────────────
const getMuzeuId = async (req, res, next) => {
    try {
        const u = await db.select({ muzeuId: user.muzeuId })
            .from(user).where(eq(user.id, req.user.id)).get();
        if (!u?.muzeuId) {
            return res.status(403).json({ success: false, error: 'Nu aveți un muzeu alocat acestui cont.' });
        }
        req.muzeuId = u.muzeuId;
        next();
    } catch (e) {
        return res.status(500).json({ success: false, error: 'Eroare la identificarea muzeului.' });
    }
};

router.get('/dashboard', getMuzeuId, getStaffDashboard);

// ── GET /api/staff/museum-reports/marketing ────────────────────────────────────
router.get('/museum-reports/marketing', getMuzeuId, async (req, res) => {
    try {
        const mId = req.muzeuId;

        // 1. Distribuție rating (1-5 stele)
        const ratingDist = await db.select({
            rating: recenzii.rating,
            count: sql`COUNT(*)`.as('count'),
        }).from(recenzii)
            .where(eq(recenzii.codUnicLocatie, mId))
            .groupBy(recenzii.rating)
            .orderBy(recenzii.rating)
            .all();

        // Completăm cu toate valorile 1-5 chiar dacă nu există date
        const ratingMap = Object.fromEntries(ratingDist.map(r => [r.rating, Number(r.count)]));
        const ratingDistributie = [1, 2, 3, 4, 5].map(r => ({
            stele: `${r} ★`,
            count: ratingMap[r] || 0,
        }));

        // 2. Rating mediu + total recenzii
        const ratingStats = await db.select({
            total: sql`COUNT(*)`.as('total'),
            medie: sql`ROUND(AVG(${recenzii.rating}), 2)`.as('medie'),
        }).from(recenzii).where(eq(recenzii.codUnicLocatie, mId)).get();

        // 3. Evoluție lunară recenzii (ultimele 6 luni)
        const evolutieRecenzii = await db.select({
            luna: sql`strftime('%Y-%m', ${recenzii.dataRecenzie})`.as('luna'),
            count: sql`COUNT(*)`.as('count'),
        }).from(recenzii)
            .where(and(
                eq(recenzii.codUnicLocatie, mId),
                sql`${recenzii.dataRecenzie} >= date('now', '-6 months')`
            ))
            .groupBy(sql`strftime('%Y-%m', ${recenzii.dataRecenzie})`)
            .orderBy(sql`strftime('%Y-%m', ${recenzii.dataRecenzie})`)
            .all();

        // 4. Top 5 evenimente după rezervări
        const topEvenimente = await db.select({
            titlu: evenimente.titlu,
            tipEveniment: evenimente.tipEveniment,
            rezervari: sql`COUNT(${rezervariEvenimente.id})`.as('rezervari'),
            persoane: sql`SUM(${rezervariEvenimente.nrPersoane})`.as('persoane'),
        }).from(evenimente)
            .leftJoin(rezervariEvenimente, eq(rezervariEvenimente.eventId, evenimente.id))
            .where(eq(evenimente.codUnicLocatie, mId))
            .groupBy(evenimente.id)
            .orderBy(desc(sql`COUNT(${rezervariEvenimente.id})`))
            .limit(5)
            .all();

        // 5. Distribuție tipuri vizitatori (din bilete cumpărate)
        const tipuriVizitatori = await db.select({
            tip: tipuriBilete.tipBilet,
            count: sql`SUM(${bileteCumparate.cantitate})`.as('count'),
        }).from(bileteCumparate)
            .innerJoin(tipuriBilete, eq(bileteCumparate.codUnicTipBilet, tipuriBilete.codUnicTipBilet))
            .where(and(
                eq(tipuriBilete.codUnicLocatie, mId),
                sql`${tipuriBilete.codUnicEveniment} IS NULL`
            ))
            .groupBy(tipuriBilete.tipBilet)
            .all();

        // 6. Sentiment breakdown (pozitive / neutre / negative)
        const sentimentRaw = await db.select({
            pozitive: sql`COUNT(CASE WHEN ${recenzii.rating} >= 4 THEN 1 END)`.as('pozitive'),
            neutre: sql`COUNT(CASE WHEN ${recenzii.rating} = 3 THEN 1 END)`.as('neutre'),
            negative: sql`COUNT(CASE WHEN ${recenzii.rating} <= 2 THEN 1 END)`.as('negative'),
            total: sql`COUNT(*)`.as('total'),
        }).from(recenzii).where(eq(recenzii.codUnicLocatie, mId)).get();

        const sentTotal = Number(sentimentRaw?.total || 0);
        const sentimentBreakdown = {
            pozitive: Number(sentimentRaw?.pozitive || 0),
            neutre: Number(sentimentRaw?.neutre || 0),
            negative: Number(sentimentRaw?.negative || 0),
            pctPozitive: sentTotal > 0 ? Math.round((Number(sentimentRaw.pozitive) / sentTotal) * 100) : 0,
            pctNeutre: sentTotal > 0 ? Math.round((Number(sentimentRaw.neutre) / sentTotal) * 100) : 0,
            pctNegative: sentTotal > 0 ? Math.round((Number(sentimentRaw.negative) / sentTotal) * 100) : 0,
        };

        // 7. Recenzii negative recente (rating <= 2)
        const recenziiNegative = await db.select({
            numarRecenzie: recenzii.numarRecenzie,
            rating: recenzii.rating,
            descriere: recenzii.descriereRecenzie,
            data: recenzii.dataRecenzie,
            userName: user.name,
        }).from(recenzii)
            .leftJoin(user, eq(user.id, recenzii.codUnicUtilizator))
            .where(and(
                eq(recenzii.codUnicLocatie, mId),
                sql`${recenzii.rating} <= 2`
            ))
            .orderBy(desc(recenzii.dataRecenzie))
            .limit(10)
            .all();

        res.json({
            success: true,
            data: {
                ratingDistributie,
                ratingStats: { total: Number(ratingStats?.total || 0), medie: Number(ratingStats?.medie || 0) },
                evolutieRecenzii: evolutieRecenzii.map(r => ({ luna: r.luna, count: Number(r.count) })),
                topEvenimente: topEvenimente.map(e => ({
                    titlu: e.titlu,
                    tip: e.tipEveniment || 'General',
                    rezervari: Number(e.rezervari || 0),
                    persoane: Number(e.persoane || 0),
                })),
                tipuriVizitatori: tipuriVizitatori.map(t => ({ tip: t.tip, count: Number(t.count || 0) })),
                sentimentBreakdown,
                recenziiNegative: recenziiNegative.map(r => ({
                    numarRecenzie: r.numarRecenzie,
                    rating: r.rating,
                    descriere: r.descriere,
                    data: r.data,
                    userName: r.userName || 'Anonim',
                })),
            },
        });
    } catch (error) {
        console.error('Error museum marketing report:', error);
        res.status(500).json({ success: false, error: 'Eroare la generarea raportului de marketing.' });
    }
});

// ── GET /api/staff/museum-reports/director ─────────────────────────────────────
router.get('/museum-reports/director', getMuzeuId, async (req, res) => {
    try {
        const mId = req.muzeuId;

        // 1. Venituri + comenzi pe luni (ultimele 12 luni)
        const venituriLunare = await db.select({
            luna: sql`strftime('%Y-%m', ${comenzi.dataComanda})`.as('luna'),
            venituri: sql`ROUND(SUM(${comenzi.totalPlata}), 2)`.as('venituri'),
            comenziCount: sql`COUNT(DISTINCT ${comenzi.numarComanda})`.as('comenziCount'),
        }).from(comenzi)
            .innerJoin(bileteCumparate, eq(bileteCumparate.numarComanda, comenzi.numarComanda))
            .innerJoin(tipuriBilete, eq(bileteCumparate.codUnicTipBilet, tipuriBilete.codUnicTipBilet))
            .where(and(
                eq(tipuriBilete.codUnicLocatie, mId),
                eq(comenzi.statusPlata, 'Plătit'),
                sql`${comenzi.dataComanda} >= date('now', '-12 months')`
            ))
            .groupBy(sql`strftime('%Y-%m', ${comenzi.dataComanda})`)
            .orderBy(sql`strftime('%Y-%m', ${comenzi.dataComanda})`)
            .all();

        // 2. KPI-uri totale
        const kpi = await db.select({
            totalVenituri: sql`ROUND(SUM(${comenzi.totalPlata}), 2)`.as('totalVenituri'),
            totalComenzi: sql`COUNT(DISTINCT ${comenzi.numarComanda})`.as('totalComenzi'),
            totalBilete: sql`SUM(${bileteCumparate.cantitate})`.as('totalBilete'),
        }).from(comenzi)
            .innerJoin(bileteCumparate, eq(bileteCumparate.numarComanda, comenzi.numarComanda))
            .innerJoin(tipuriBilete, eq(bileteCumparate.codUnicTipBilet, tipuriBilete.codUnicTipBilet))
            .where(and(
                eq(tipuriBilete.codUnicLocatie, mId),
                eq(comenzi.statusPlata, 'Plătit')
            ))
            .get();

        // 3. Rating mediu
        const ratingMediu = await db.select({
            medie: sql`ROUND(AVG(${recenzii.rating}), 2)`.as('medie'),
            total: sql`COUNT(*)`.as('total'),
        }).from(recenzii).where(eq(recenzii.codUnicLocatie, mId)).get();

        // 4. Top 5 evenimente după venituri (bilete cu pret)
        const topEvenimenteVenituri = await db.select({
            titlu: evenimente.titlu,
            venituri: sql`ROUND(SUM(${comenzi.totalPlata}), 2)`.as('venituri'),
            comenziCount: sql`COUNT(DISTINCT ${comenzi.numarComanda})`.as('comenziCount'),
        }).from(evenimente)
            .innerJoin(tipuriBilete, eq(tipuriBilete.codUnicEveniment, evenimente.id))
            .innerJoin(bileteCumparate, eq(bileteCumparate.codUnicTipBilet, tipuriBilete.codUnicTipBilet))
            .innerJoin(comenzi, eq(comenzi.numarComanda, bileteCumparate.numarComanda))
            .where(and(
                eq(evenimente.codUnicLocatie, mId),
                eq(comenzi.statusPlata, 'Plătit')
            ))
            .groupBy(evenimente.id)
            .orderBy(desc(sql`SUM(${comenzi.totalPlata})`))
            .limit(5)
            .all();

        // 5. Distribuție status comenzi
        const statusComenzi = await db.select({
            status: comenzi.statusPlata,
            count: sql`COUNT(DISTINCT ${comenzi.numarComanda})`.as('count'),
        }).from(comenzi)
            .innerJoin(bileteCumparate, eq(bileteCumparate.numarComanda, comenzi.numarComanda))
            .innerJoin(tipuriBilete, eq(bileteCumparate.codUnicTipBilet, tipuriBilete.codUnicTipBilet))
            .where(eq(tipuriBilete.codUnicLocatie, mId))
            .groupBy(comenzi.statusPlata)
            .all();

        // 6. Distribuție card fidelitate vizitatori (câte comenzi per nivel card)
        const loyaltyRaw = await db.select({
            numeCard: cardFidelitate.numeCard,
            tipCard: cardFidelitate.tipUnicCard,
            comenziCount: sql`COUNT(DISTINCT ${comenzi.numarComanda})`.as('comenziCount'),
            utilizatoriCount: sql`COUNT(DISTINCT ${comenzi.codUnicUtilizator})`.as('utilizatoriCount'),
            venituri: sql`ROUND(SUM(${comenzi.totalPlata}), 2)`.as('venituri'),
        }).from(comenzi)
            .innerJoin(bileteCumparate, eq(bileteCumparate.numarComanda, comenzi.numarComanda))
            .innerJoin(tipuriBilete, eq(bileteCumparate.codUnicTipBilet, tipuriBilete.codUnicTipBilet))
            .innerJoin(carduriClienti, eq(carduriClienti.codUnicUtilizator, comenzi.codUnicUtilizator))
            .innerJoin(cardFidelitate, eq(cardFidelitate.tipUnicCard, carduriClienti.tipUnicCard))
            .where(and(
                eq(tipuriBilete.codUnicLocatie, mId),
                eq(comenzi.statusPlata, 'Plătit')
            ))
            .groupBy(cardFidelitate.tipUnicCard)
            .orderBy(cardFidelitate.tipUnicCard)
            .all();

        const totalLoyaltyOrders = loyaltyRaw.reduce((s, r) => s + Number(r.comenziCount), 0);
        const loyaltyDistributie = loyaltyRaw.map(r => ({
            numeCard: r.numeCard,
            comenzi: Number(r.comenziCount || 0),
            utilizatori: Number(r.utilizatoriCount || 0),
            venituri: Number(r.venituri || 0),
            pct: totalLoyaltyOrders > 0 ? Math.round((Number(r.comenziCount) / totalLoyaltyOrders) * 100) : 0,
        }));

        res.json({
            success: true,
            data: {
                venituriLunare: venituriLunare.map(v => ({
                    luna: v.luna,
                    venituri: Number(v.venituri || 0),
                    comenzi: Number(v.comenziCount || 0),
                })),
                kpi: {
                    totalVenituri: Number(kpi?.totalVenituri || 0),
                    totalComenzi: Number(kpi?.totalComenzi || 0),
                    totalBilete: Number(kpi?.totalBilete || 0),
                    ratingMediu: Number(ratingMediu?.medie || 0),
                    totalRecenzii: Number(ratingMediu?.total || 0),
                },
                topEvenimenteVenituri: topEvenimenteVenituri.map(e => ({
                    titlu: e.titlu,
                    venituri: Number(e.venituri || 0),
                    comenzi: Number(e.comenziCount || 0),
                })),
                statusComenzi: statusComenzi.map(s => ({ status: s.status, count: Number(s.count || 0) })),
                loyaltyDistributie,
            },
        });
    } catch (error) {
        console.error('Error museum director report:', error);
        res.status(500).json({ success: false, error: 'Eroare la generarea raportului de management.' });
    }
});

export default router;
