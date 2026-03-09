import { db } from '../db/db.js';
import { user, recenzii, comenzi, carduriClienti, cardFidelitate, locatiiPublice, rezervariEvenimente, evenimente } from '../db/schema.js';
import { eq, sql, ne, desc } from 'drizzle-orm';

/**
 * GET /api/admin/users
 * Get all users with stats (excludes Admin users)
 */
export const getAllUsers = async (req, res) => {
    try {
        const users = await db
            .select({
                id: user.id,
                name: user.name,
                email: user.email,
                emailVerified: user.emailVerified,
                image: user.image,
                createdAt: user.createdAt,
                role: user.role,
                cardName: cardFidelitate.numeCard,
                cardType: carduriClienti.tipUnicCard,
                cardPoints: cardFidelitate.puncteCard,
                orderCount: sql`COUNT(DISTINCT ${comenzi.numarComanda})`.as('orderCount'),
                reviewCount: sql`COUNT(DISTINCT ${recenzii.numarRecenzie})`.as('reviewCount'),
            })
            .from(user)
            .leftJoin(carduriClienti, eq(user.id, carduriClienti.codUnicUtilizator))
            .leftJoin(cardFidelitate, eq(carduriClienti.tipUnicCard, cardFidelitate.tipUnicCard))
            .leftJoin(comenzi, eq(user.id, comenzi.codUnicUtilizator))
            .leftJoin(recenzii, eq(user.id, recenzii.codUnicUtilizator))
            .where(ne(user.role, 'Admin')) // Exclude admin users
            .groupBy(user.id);

        res.json({
            success: true,
            count: users.length,
            data: users,
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            error: 'Nu s-au putut prelua utilizatorii',
        });
    }
};

/**
 * GET /api/admin/users/:id
 * Get user details with orders and reviews
 */
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        // Get user
        const userData = await db
            .select()
            .from(user)
            .where(eq(user.id, id))
            .limit(1);

        if (userData.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Utilizatorul nu a fost găsit',
            });
        }

        // Get user's orders
        const userOrders = await db
            .select()
            .from(comenzi)
            .where(eq(comenzi.codUnicUtilizator, id));

        // Get user's reviews
        const userReviews = await db
            .select()
            .from(recenzii)
            .where(eq(recenzii.codUnicUtilizator, id));

        res.json({
            success: true,
            data: {
                ...userData[0],
                orders: userOrders,
                reviews: userReviews,
            },
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            error: 'Nu s-a putut prelua utilizatorul',
        });
    }
};

/**
 * DELETE /api/admin/users/:id
 * Delete user (Admin only)
 */
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user exists
        const existing = await db
            .select()
            .from(user)
            .where(eq(user.id, id))
            .limit(1);

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Utilizatorul nu a fost găsit',
            });
        }

        // Delete user (cascade will handle related records)
        await db.delete(user).where(eq(user.id, id));

        res.json({
            success: true,
            message: 'Utilizatorul a fost șters cu succes',
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            error: 'Nu s-a putut șterge utilizatorul',
        });
    }
};

/**
 * GET /api/admin/dashboard
 * Get dashboard statistics
 */
export const getDashboardStats = async (req, res) => {
    try {
        // Count locations
        const locationsResult = await db
            .select({ count: sql`COUNT(*)` })
            .from(locatiiPublice);

        // Count users (only Utilizator role)
        const usersResult = await db
            .select({ count: sql`COUNT(*)` })
            .from(user)
            .where(eq(user.role, 'Utilizator'));

        // Count orders
        const ordersResult = await db
            .select({ count: sql`COUNT(*)` })
            .from(comenzi);

        // Count reviews
        const reviewsResult = await db
            .select({ count: sql`COUNT(*)` })
            .from(recenzii);

        // Count reservations
        const reservationsResult = await db
            .select({ count: sql`COUNT(*)` })
            .from(rezervariEvenimente);

        // Count events
        const eventsResult = await db
            .select({ count: sql`COUNT(*)` })
            .from(evenimente);

        // Total revenue (paid orders only)
        const revenueResult = await db
            .select({ total: sql`COALESCE(SUM(total_plata), 0)` })
            .from(comenzi)
            .where(eq(comenzi.statusPlata, 'Plătit'));

        // Recent orders (last 5)
        const recentOrders = await db
            .select({
                numarComanda: comenzi.numarComanda,
                totalPlata: comenzi.totalPlata,
                statusPlata: comenzi.statusPlata,
                dataComanda: comenzi.dataComanda,
                userName: user.name,
            })
            .from(comenzi)
            .leftJoin(user, eq(comenzi.codUnicUtilizator, user.id))
            .orderBy(desc(comenzi.numarComanda))
            .limit(5);

        // Recent reviews (last 5)
        const recentReviews = await db
            .select({
                numarRecenzie: recenzii.numarRecenzie,
                rating: recenzii.rating,
                dataRecenzie: recenzii.dataRecenzie,
                userName: user.name,
                numeLoc: locatiiPublice.numeLoc,
            })
            .from(recenzii)
            .leftJoin(user, eq(recenzii.codUnicUtilizator, user.id))
            .leftJoin(locatiiPublice, eq(recenzii.codUnicLocatie, locatiiPublice.codUnicLocatie))
            .orderBy(desc(recenzii.dataRecenzie))
            .limit(5);

        res.json({
            success: true,
            data: {
                locations: locationsResult[0]?.count || 0,
                users: usersResult[0]?.count || 0,
                orders: ordersResult[0]?.count || 0,
                reviews: reviewsResult[0]?.count || 0,
                events: eventsResult[0]?.count || 0,
                reservations: reservationsResult[0]?.count || 0,
                revenue: revenueResult[0]?.total || 0,
                recentOrders,
                recentReviews,
            },
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Nu s-au putut prelua statisticile',
        });
    }
};

/**
 * GET /api/admin/reservations
 * Get all event reservations with user and event details
 */
export const getAllReservations = async (req, res) => {
    try {
        const reservations = await db
            .select({
                id: rezervariEvenimente.id,
                nrPersoane: rezervariEvenimente.nrPersoane,
                ziuaAleasa: rezervariEvenimente.ziuaAleasa,
                intervalOrar: rezervariEvenimente.intervalOrar,
                dataRezervare: rezervariEvenimente.dataRezervare,
                userName: user.name,
                userEmail: user.email,
                eventTitle: evenimente.titlu,
                eventType: evenimente.tipEveniment,
            })
            .from(rezervariEvenimente)
            .leftJoin(user, eq(rezervariEvenimente.userId, user.id))
            .leftJoin(evenimente, eq(rezervariEvenimente.eventId, evenimente.id))
            .orderBy(rezervariEvenimente.dataRezervare);

        res.json({ success: true, count: reservations.length, data: reservations });
    } catch (error) {
        console.error('Get reservations error:', error);
        res.status(500).json({ success: false, error: 'Nu s-au putut prelua rezervările' });
    }
};
