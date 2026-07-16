import express from 'express';
import { getStaffDashboard } from '../controllers/staff.controller.js';
import { requireAuth, requireStaff } from '../middleware/authMiddleware.js';
import { db } from '../db/db.js';
import { user, recenzii, evenimente, rezervariEvenimente, comenzi, bileteCumparate, tipuriBilete, carduriClienti, cardFidelitate } from '../db/schema.js';
import { eq, sql, desc, and } from 'drizzle-orm';

const router = express.Router();

router.use(requireAuth);
router.use(requireStaff);

// Middleware care extrage muzeuId din profilul staff-ului curent
// Fiecare cont de Personal/Admin este alocat unui singur muzeu — blocăm accesul dacă nu e setat
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

// Raport de marketing al muzeului — date pentru echipa de marketing/PR a unei locații
// Cuprinde: distribuția ratingurilor, evoluție lunară, top evenimente, tipuri vizitatori, sentiment
router.get('/museum-reports/marketing', getMuzeuId, async (req, res) => {
    try {
        const mId = req.muzeuId;

        // Distribuția ratingurilor 1-5 — completăm cu 0 pentru valorile lipsă
        const ratingDist = await db.select({
            rating: recenzii.rating,
            count: sql`COUNT(*)`.as('count'),
        }).from(recenzii)
            .where(eq(recenzii.codUnicLocatie, mId))
            .groupBy(recenzii.rating)
            .orderBy(recenzii.rating)
            .all();

        const ratingMap = Object.fromEntries(ratingDist.map(r => [r.rating, Number(r.count)]));
        const ratingDistributie = [1, 2, 3, 4, 5].map(r => ({
            stele: `${r} ★`,
            count: ratingMap[r] || 0,
        }));

        const ratingStats = await db.select({
            total: sql`COUNT(*)`.as('total'),
            medie: sql`ROUND(AVG(${recenzii.rating}), 2)`.as('medie'),
        }).from(recenzii).where(eq(recenzii.codUnicLocatie, mId)).get();

        // Evoluția lunară a recenziilor (ultimele 6 luni)
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

        // Top 5 evenimente după numărul de rezervări
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

        // Distribuția tipurilor de vizitatori din biletele de intrare (excluzând biletele de eveniment)
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

        // Sentimentul recenziilor: pozitive (≥4), neutre (=3), negative (≤2)
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

        // Ultimele 10 recenzii negative (rating ≤ 2) pentru follow-up
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

// Raport de management al muzeului — date financiare pentru directorul/administratorul locației
// Cuprinde: venituri lunare, KPI-uri, top evenimente după venituri, distribuția cardurilor de fidelitate
router.get('/museum-reports/director', getMuzeuId, async (req, res) => {
    try {
        const mId = req.muzeuId;

        // Venituri și comenzi lunare (ultimele 12 luni) — pentru graficul de evoluție financiară
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

        // KPI-uri totale: venituri, comenzi, bilete vândute, rating mediu
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

        const ratingMediu = await db.select({
            medie: sql`ROUND(AVG(${recenzii.rating}), 2)`.as('medie'),
            total: sql`COUNT(*)`.as('total'),
        }).from(recenzii).where(eq(recenzii.codUnicLocatie, mId)).get();

        // Top 5 evenimente după venituri generate din biletele plătite
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

        // Distribuția comenzilor pe status (Plătit/Anulat/În așteptare)
        const statusComenzi = await db.select({
            status: comenzi.statusPlata,
            count: sql`COUNT(DISTINCT ${comenzi.numarComanda})`.as('count'),
        }).from(comenzi)
            .innerJoin(bileteCumparate, eq(bileteCumparate.numarComanda, comenzi.numarComanda))
            .innerJoin(tipuriBilete, eq(bileteCumparate.codUnicTipBilet, tipuriBilete.codUnicTipBilet))
            .where(eq(tipuriBilete.codUnicLocatie, mId))
            .groupBy(comenzi.statusPlata)
            .all();

        // Distribuția vizitatorilor pe tipul cardului de fidelitate (câte comenzi/venituri per nivel)
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
