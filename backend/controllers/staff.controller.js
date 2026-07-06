import { db } from '../db/db.js';
import { comenzi, user, recenzii, locatiiPublice, tipuriBilete, bileteCumparate } from '../db/schema.js';
import { eq, sql, and } from 'drizzle-orm';

/**
 * GET /api/staff/dashboard
 * Get dashboard stats for staff filtered by their assigned museum (req.muzeuId)
 */
export const getStaffDashboard = async (req, res) => {
    try {
        const { range = 'month' } = req.query;
        const muzeuId = req.muzeuId; // Set by getMuzeuId middleware

        // Calculate date filter
        const now = Date.now();
        let dateFromTimestamp;

        switch (range) {
            case 'week':
                dateFromTimestamp = now - 7 * 24 * 60 * 60 * 1000;
                break;
            case 'month':
                dateFromTimestamp = now - 30 * 24 * 60 * 60 * 1000;
                break;
            case 'year':
                dateFromTimestamp = now - 365 * 24 * 60 * 60 * 1000;
                break;
            default:
                dateFromTimestamp = now - 30 * 24 * 60 * 60 * 1000;
        }

        // ISO date string for filtering comenzi.dataComanda (TEXT field: "YYYY-MM-DD HH:MM:SS")
        const dateFromISO = new Date(dateFromTimestamp).toISOString().replace('T', ' ').slice(0, 19);

        // Count first-time buyers for this museum in the date range:
        // Users who have at least one order from this museum in the range
        // AND have NO orders from this museum before the range start.
        const usersResult = await db.select({
            count: sql`COUNT(DISTINCT sub.cod_unic_utilizator)`
        }).from(
            sql`(
                SELECT c.cod_unic_utilizator
                FROM comenzi c
                INNER JOIN bilete_cumparate bc ON bc.numar_comanda = c.numar_comanda
                INNER JOIN tipuri_bilete tb ON tb.cod_unic_tip_bilet = bc.cod_unic_tip_bilet
                WHERE tb.cod_unic_locatie = ${muzeuId}
                  AND c.data_comanda >= ${dateFromISO}
                  AND c.cod_unic_utilizator NOT IN (
                      SELECT DISTINCT c2.cod_unic_utilizator
                      FROM comenzi c2
                      INNER JOIN bilete_cumparate bc2 ON bc2.numar_comanda = c2.numar_comanda
                      INNER JOIN tipuri_bilete tb2 ON tb2.cod_unic_tip_bilet = bc2.cod_unic_tip_bilet
                      WHERE tb2.cod_unic_locatie = ${muzeuId}
                        AND c2.data_comanda < ${dateFromISO}
                  )
            ) AS sub
        `);

        // Count new orders for this museum in the date range
        // Orders -> bileteCumparate -> tipuriBilete -> locatiiPublice
        const ordersResult = await db
            .select({ count: sql`COUNT(DISTINCT ${comenzi.numarComanda})` })
            .from(comenzi)
            .innerJoin(bileteCumparate, eq(bileteCumparate.numarComanda, comenzi.numarComanda))
            .innerJoin(tipuriBilete, eq(tipuriBilete.codUnicTipBilet, bileteCumparate.codUnicTipBilet))
            .where(and(
                eq(tipuriBilete.codUnicLocatie, muzeuId),
                sql`${comenzi.dataComanda} >= ${dateFromISO}`
            ));

        // Count new reviews for this museum in the date range
        const reviewsResult = await db
            .select({ count: sql`COUNT(*)` })
            .from(recenzii)
            .where(and(
                eq(recenzii.codUnicLocatie, muzeuId),
                sql`${recenzii.dataRecenzie} >= ${dateFromISO}`
            ));

        // Total revenue from PAID orders for this museum only
        const revenueResult = await db
            .select({ total: sql`COALESCE(SUM(${comenzi.totalPlata}), 0)` })
            .from(comenzi)
            .innerJoin(bileteCumparate, eq(bileteCumparate.numarComanda, comenzi.numarComanda))
            .innerJoin(tipuriBilete, eq(tipuriBilete.codUnicTipBilet, bileteCumparate.codUnicTipBilet))
            .where(and(
                eq(tipuriBilete.codUnicLocatie, muzeuId),
                eq(comenzi.statusPlata, 'Plătit')
            ));

        // Museum info
        const muzeuInfo = await db
            .select({ name: locatiiPublice.numeLoc, type: locatiiPublice.tipLocatie })
            .from(locatiiPublice)
            .where(eq(locatiiPublice.codUnicLocatie, muzeuId))
            .get();

        // Top 5 ticket types by number of tickets sold for this museum
        const topTicketTypes = await db
            .select({
                tipBilet: tipuriBilete.tipBilet,
                pret: tipuriBilete.pret,
                cantitate: sql`COALESCE(SUM(${bileteCumparate.cantitate}), 0)`.as('cantitate'),
                venituri: sql`COALESCE(SUM(${bileteCumparate.cantitate} * ${tipuriBilete.pret}), 0)`.as('venituri'),
            })
            .from(tipuriBilete)
            .leftJoin(bileteCumparate, eq(tipuriBilete.codUnicTipBilet, bileteCumparate.codUnicTipBilet))
            .leftJoin(comenzi, and(
                eq(bileteCumparate.numarComanda, comenzi.numarComanda),
                eq(comenzi.statusPlata, 'Plătit')
            ))
            .where(eq(tipuriBilete.codUnicLocatie, muzeuId))
            .groupBy(tipuriBilete.tipBilet, tipuriBilete.pret)
            .orderBy(sql`cantitate DESC`)
            .limit(5);

        // Latest reviews for this museum (top 5 most recent)
        const recentReviews = await db
            .select({
                numarRecenzie: recenzii.numarRecenzie,
                rating: recenzii.rating,
                descriere: recenzii.descriereRecenzie,
                data: recenzii.dataRecenzie,
                userName: user.name,
            })
            .from(recenzii)
            .leftJoin(user, eq(user.id, recenzii.codUnicUtilizator))
            .where(eq(recenzii.codUnicLocatie, muzeuId))
            .orderBy(sql`${recenzii.dataRecenzie} DESC`)
            .limit(5);

        console.log('Staff Dashboard (museum-specific) debug:', {
            muzeuId,
            muzeuName: muzeuInfo?.name,
            firstTimeBuyers: usersResult[0]?.count,
            newOrders: ordersResult[0]?.count,
            newReviews: reviewsResult[0]?.count,
            totalRevenue: revenueResult[0]?.total,
            dateFromISO,
        });

        res.json({
            success: true,
            data: {
                muzeu: muzeuInfo,
                stats: {
                    newUsers: usersResult[0]?.count || 0,
                    newOrders: ordersResult[0]?.count || 0,
                    newReviews: reviewsResult[0]?.count || 0,
                    totalRevenue: revenueResult[0]?.total || 0,
                },
                topTicketTypes,
                recentReviews,
            },
        });
    } catch (error) {
        console.error('Staff dashboard error:', error);
        res.status(500).json({
            success: false,
            error: 'Nu s-au putut prelua datele dashboard-ului',
        });
    }
};
