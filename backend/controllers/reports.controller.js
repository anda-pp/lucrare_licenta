import { db } from '../db/db.js';
import { comenzi, user, recenzii, locatiiPublice, tipuriBilete, bileteCumparate } from '../db/schema.js';
import { eq, sql, gte, and } from 'drizzle-orm';

// Raport general cu statistici agregate — filtrabil pe interval de timp (week/month/year/all)
export const getReports = async (req, res) => {
    try {
        const { range = 'month' } = req.query;

        // Calculăm data de start a filtrului în funcție de parametrul `range`
        const now = new Date();
        let dateFrom;

        switch (range) {
            case 'week':
                dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'year':
                dateFrom = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            case 'all':
            default:
                dateFrom = null;
        }

        // Venituri totale din comenzile plătite
        let revenueQuery = db
            .select({ total: sql`COALESCE(SUM(${comenzi.totalPlata}), 0)` })
            .from(comenzi)
            .where(eq(comenzi.statusPlata, 'Plătit'));

        let ordersQuery = db.select({ count: sql`COUNT(*)` }).from(comenzi);

        let paidOrdersQuery = db
            .select({ count: sql`COUNT(*)` })
            .from(comenzi)
            .where(eq(comenzi.statusPlata, 'Plătit'));

        let pendingOrdersQuery = db
            .select({ count: sql`COUNT(*)` })
            .from(comenzi)
            .where(eq(comenzi.statusPlata, 'În așteptare'));

        // Numărăm doar utilizatorii cu rol Utilizator (excluem staff-ul)
        let newUsersQuery = db
            .select({ count: sql`COUNT(*)` })
            .from(user)
            .where(eq(user.role, 'Utilizator'));

        let reviewsQuery = db
            .select({
                count: sql`COUNT(*)`,
                avgRating: sql`COALESCE(AVG(${recenzii.rating}), 0)`,
            })
            .from(recenzii);

        const [revenueResult, ordersResult, paidResult, pendingResult, usersResult, reviewsResult] =
            await Promise.all([
                revenueQuery,
                ordersQuery,
                paidOrdersQuery,
                pendingOrdersQuery,
                newUsersQuery,
                reviewsQuery,
            ]);

        // Top 5 locații după veniturile generate din bilete plătite
        const topLocationsQuery = await db
            .select({
                id: locatiiPublice.codUnicLocatie,
                name: locatiiPublice.numeLoc,
                revenue: sql`COALESCE(SUM(${comenzi.totalPlata}), 0)`.as('revenue'),
            })
            .from(locatiiPublice)
            .leftJoin(tipuriBilete, eq(locatiiPublice.codUnicLocatie, tipuriBilete.codUnicLocatie))
            .leftJoin(bileteCumparate, eq(tipuriBilete.codUnicTipBilet, bileteCumparate.codUnicTipBilet))
            .leftJoin(comenzi, and(
                eq(bileteCumparate.numarComanda, comenzi.numarComanda),
                eq(comenzi.statusPlata, 'Plătit')
            ))
            .groupBy(locatiiPublice.codUnicLocatie)
            .orderBy(sql`revenue DESC`)
            .limit(5);

        res.json({
            success: true,
            data: {
                totalRevenue: revenueResult[0]?.total || 0,
                totalOrders: ordersResult[0]?.count || 0,
                paidOrders: paidResult[0]?.count || 0,
                pendingOrders: pendingResult[0]?.count || 0,
                newUsers: usersResult[0]?.count || 0,
                totalReviews: reviewsResult[0]?.count || 0,
                avgRating: reviewsResult[0]?.avgRating || 0,
                topLocations: topLocationsQuery,
            },
        });
    } catch (error) {
        console.error('Reports error:', error);
        res.status(500).json({
            success: false,
            error: 'Nu s-au putut genera rapoartele',
        });
    }
};
