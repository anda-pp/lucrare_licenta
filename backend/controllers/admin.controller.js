import { db } from '../db/db.js';
import { user, recenzii, comenzi, carduriClienti, cardFidelitate, locatiiPublice, rezervariEvenimente, evenimente } from '../db/schema.js';
import { eq, sql, desc } from 'drizzle-orm';

// Returnează toți utilizatorii cu rol Utilizator, cu statistici agregate (comenzi, recenzii, tip card)
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
            .where(eq(user.role, 'Utilizator'))
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

// Returnează detaliile unui utilizator specific împreună cu comenzile și recenziile lui
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

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

        const userOrders = await db
            .select()
            .from(comenzi)
            .where(eq(comenzi.codUnicUtilizator, id));

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

// Șterge un utilizator — cascade în DB elimină și sesiunile, comenzile etc.
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

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

// Statistici pentru dashboard-ul superadmin: locații, utilizatori, comenzi, venituri, recenzii, rezervări
export const getDashboardStats = async (req, res) => {
    try {
        const locationsResult = await db
            .select({ count: sql`COUNT(*)` })
            .from(locatiiPublice);

        const usersResult = await db
            .select({ count: sql`COUNT(*)` })
            .from(user)
            .where(eq(user.role, 'Utilizator'));

        const ordersResult = await db
            .select({ count: sql`COUNT(*)` })
            .from(comenzi);

        const reviewsResult = await db
            .select({ count: sql`COUNT(*)` })
            .from(recenzii);

        const reservationsResult = await db
            .select({ count: sql`COUNT(*)` })
            .from(rezervariEvenimente);

        const eventsResult = await db
            .select({ count: sql`COUNT(*)` })
            .from(evenimente);

        // Venituri totale — doar din comenzile cu status Plătit
        const revenueResult = await db
            .select({ total: sql`COALESCE(SUM(total_plata), 0)` })
            .from(comenzi)
            .where(eq(comenzi.statusPlata, 'Plătit'));

        // Ultimele 5 comenzi pentru feed-ul de activitate
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

        // Ultimele 5 recenzii pentru feed-ul de activitate
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

// Toate rezervările la evenimente din platformă, cu detalii despre user și eveniment
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
