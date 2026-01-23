import { db } from '../db/db.js';
import { comenzi, user, recenzii, locatiiPublice, tipuriBilete, bileteCumparate } from '../db/schema.js';
import { eq, sql, gte, and } from 'drizzle-orm';

/**
 * GET /api/reports
 * Get report data with optional date range filter
 */
export const getReports = async (req, res) => {
    try {
        const { range = 'month' } = req.query;

        // Calculate date filter
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

        // Total revenue from paid orders
        let revenueQuery = db
            .select({ total: sql`COALESCE(SUM(${comenzi.totalPlata}), 0)` })
            .from(comenzi)
            .where(eq(comenzi.statusPlata, 'Plătit'));

        // Total orders
        let ordersQuery = db.select({ count: sql`COUNT(*)` }).from(comenzi);

        // Paid orders
        let paidOrdersQuery = db
            .select({ count: sql`COUNT(*)` })
            .from(comenzi)
            .where(eq(comenzi.statusPlata, 'Plătit'));

        // Pending orders
        let pendingOrdersQuery = db
            .select({ count: sql`COUNT(*)` })
            .from(comenzi)
            .where(eq(comenzi.statusPlata, 'În așteptare'));

        // New users (with Utilizator role)
        let newUsersQuery = db
            .select({ count: sql`COUNT(*)` })
            .from(user)
            .where(eq(user.role, 'Utilizator'));

        // Reviews count and average rating
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

        // Top locations by revenue
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
