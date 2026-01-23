import { db } from '../db/db.js';
import { comenzi, user, recenzii, locatiiPublice, tipuriBilete, bileteCumparate } from '../db/schema.js';
import { eq, sql, and } from 'drizzle-orm';

/**
 * GET /api/staff/dashboard
 * Get dashboard stats for staff with date range filter
 */
export const getStaffDashboard = async (req, res) => {
    try {
        const { range = 'month' } = req.query;

        // Calculate date filter as timestamp (seconds for BetterAuth)
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

        // BetterAuth stores createdAt as seconds (not milliseconds)
        const dateFromSeconds = Math.floor(dateFromTimestamp / 1000);

        // Count locations (total, not filtered by date)
        const locationsResult = await db
            .select({ count: sql`COUNT(*)` })
            .from(locatiiPublice);

        // Count new users (Utilizator role only)
        // BetterAuth createdAt is stored as integer seconds
        const usersResult = await db
            .select({ count: sql`COUNT(*)` })
            .from(user)
            .where(and(
                eq(user.role, 'Utilizator'),
                sql`CAST(${user.createdAt} AS INTEGER) >= ${dateFromSeconds}`
            ));

        // Also count all Utilizator users for debugging
        const allUtilizatoriResult = await db
            .select({ count: sql`COUNT(*)` })
            .from(user)
            .where(eq(user.role, 'Utilizator'));

        // Count all orders
        const ordersResult = await db
            .select({ count: sql`COUNT(*)` })
            .from(comenzi);

        // Count all reviews
        const reviewsResult = await db
            .select({ count: sql`COUNT(*)` })
            .from(recenzii);

        // Total revenue from PAID orders ONLY
        const revenueResult = await db
            .select({ total: sql`COALESCE(SUM(${comenzi.totalPlata}), 0)` })
            .from(comenzi)
            .where(eq(comenzi.statusPlata, 'Plătit'));

        // Top 5 locations by revenue (from paid orders only)
        const topLocationsByRevenue = await db
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

        // Top 5 locations by average rating
        const topLocationsByRating = await db
            .select({
                id: locatiiPublice.codUnicLocatie,
                name: locatiiPublice.numeLoc,
                avgRating: sql`COALESCE(AVG(${recenzii.rating}), 0)`.as('avgRating'),
                reviewCount: sql`COUNT(${recenzii.numarRecenzie})`.as('reviewCount'),
            })
            .from(locatiiPublice)
            .leftJoin(recenzii, eq(locatiiPublice.codUnicLocatie, recenzii.codUnicLocatie))
            .groupBy(locatiiPublice.codUnicLocatie)
            .having(sql`COUNT(${recenzii.numarRecenzie}) > 0`)
            .orderBy(sql`avgRating DESC`)
            .limit(5);

        console.log('Dashboard debug:', {
            locationsCount: locationsResult[0]?.count,
            allUtilizatori: allUtilizatoriResult[0]?.count,
            newUsersInRange: usersResult[0]?.count,
            ordersCount: ordersResult[0]?.count,
            reviewsCount: reviewsResult[0]?.count,
            totalRevenue: revenueResult[0]?.total,
            dateFromSeconds,
        });

        res.json({
            success: true,
            data: {
                stats: {
                    locations: locationsResult[0]?.count || 0,
                    newUsers: allUtilizatoriResult[0]?.count || 0, // Show all Utilizatori for now
                    newOrders: ordersResult[0]?.count || 0,
                    newReviews: reviewsResult[0]?.count || 0,
                    totalRevenue: revenueResult[0]?.total || 0,
                },
                topLocationsByRevenue,
                topLocationsByRating,
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
