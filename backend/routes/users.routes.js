import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';
import { db } from '../db/db.js';
import { comenzi, recenzii, carduriClienti, cardFidelitate, locatiiPublice, favoriteLocatii, intereseEvenimente, evenimente } from '../db/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

/**
 * GET /api/users/me
 * Get current authenticated user
 */
router.get('/me', requireAuth, async (req, res) => {
    try {
        res.json({ success: true, user: req.user });
    } catch (error) {
        res.status(500).json({ error: 'Eroare server' });
    }
});

/**
 * GET /api/users/my-orders
 * Get orders belonging to the current logged-in user
 */
router.get('/my-orders', requireAuth, async (req, res) => {
    try {
        const orders = await db
            .select()
            .from(comenzi)
            .where(eq(comenzi.codUnicUtilizator, req.user.id))
            .orderBy(desc(comenzi.numarComanda));

        res.json({ success: true, count: orders.length, data: orders });
    } catch (error) {
        console.error('Get my orders error:', error);
        res.status(500).json({ success: false, error: 'Nu s-au putut prelua comenzile tale' });
    }
});

/**
 * GET /api/users/my-reviews
 * Get reviews written by the current logged-in user
 */
router.get('/my-reviews', requireAuth, async (req, res) => {
    try {
        const reviews = await db
            .select({
                numarRecenzie: recenzii.numarRecenzie,
                rating: recenzii.rating,
                descriereRecenzie: recenzii.descriereRecenzie,
                dataRecenzie: recenzii.dataRecenzie,
                numeLocatie: locatiiPublice.numeLoc,
                orasLocatie: locatiiPublice.orasLoc,
            })
            .from(recenzii)
            .leftJoin(locatiiPublice, eq(recenzii.codUnicLocatie, locatiiPublice.codUnicLocatie))
            .where(eq(recenzii.codUnicUtilizator, req.user.id))
            .orderBy(desc(recenzii.dataRecenzie));

        res.json({ success: true, count: reviews.length, data: reviews });
    } catch (error) {
        console.error('Get my reviews error:', error);
        res.status(500).json({ success: false, error: 'Nu s-au putut prelua recenziile tale' });
    }
});

/**
 * GET /api/users/my-card
 * Get the loyalty card for the current user
 */
router.get('/my-card', requireAuth, async (req, res) => {
    try {
        const [card] = await db
            .select({
                nrUnicCard: carduriClienti.nrUnicCard,
                puncteAcumulate: carduriClienti.puncteAcumulate,
                tipUnicCard: carduriClienti.tipUnicCard,
                numeCard: cardFidelitate.numeCard,
                oferteSpeciale: cardFidelitate.oferteSpeciale,
                oferteBunVenit: cardFidelitate.oferteBunVenit,
            })
            .from(carduriClienti)
            .leftJoin(cardFidelitate, eq(carduriClienti.tipUnicCard, cardFidelitate.tipUnicCard))
            .where(eq(carduriClienti.codUnicUtilizator, req.user.id))
            .limit(1);

        res.json({ success: true, data: card || null });
    } catch (error) {
        console.error('Get my card error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/users/my-favorites
 * Get favorite locations for the current user
 */
router.get('/my-favorites', requireAuth, async (req, res) => {
    try {
        const favs = await db
            .select({
                id: favoriteLocatii.id,
                codUnicLocatie: locatiiPublice.codUnicLocatie,
                numeLoc: locatiiPublice.numeLoc,
                orasLoc: locatiiPublice.orasLoc,
                tipLocatie: locatiiPublice.tipLocatie,
                imagineUrl: locatiiPublice.imagineUrl,
            })
            .from(favoriteLocatii)
            .leftJoin(locatiiPublice, eq(favoriteLocatii.codUnicLocatie, locatiiPublice.codUnicLocatie))
            .where(eq(favoriteLocatii.codUnicUtilizator, req.user.id));

        res.json({ success: true, count: favs.length, data: favs });
    } catch (error) {
        console.error('Get my favorites error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/users/my-favorites/:locationId
 * Add location to favorites
 */
router.post('/my-favorites/:locationId', requireAuth, async (req, res) => {
    try {
        const { locationId } = req.params;
        const existing = await db
            .select()
            .from(favoriteLocatii)
            .where(and(
                eq(favoriteLocatii.codUnicUtilizator, req.user.id),
                eq(favoriteLocatii.codUnicLocatie, locationId)
            ));
        if (existing.length > 0) return res.json({ success: true, favorited: true, message: 'Deja în favorite' });

        await db.insert(favoriteLocatii).values({
            id: uuidv4(),
            codUnicUtilizator: req.user.id,
            codUnicLocatie: locationId,
        });
        res.json({ success: true, favorited: true, message: 'Adăugat la favorite!' });
    } catch (error) {
        console.error('Add favorite error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /api/users/my-favorites/:locationId
 * Remove location from favorites (only for current user)
 */
router.delete('/my-favorites/:locationId', requireAuth, async (req, res) => {
    try {
        const { locationId } = req.params;
        await db
            .delete(favoriteLocatii)
            .where(
                and(
                    eq(favoriteLocatii.codUnicUtilizator, req.user.id),
                    eq(favoriteLocatii.codUnicLocatie, locationId)
                )
            );
        res.json({ success: true, favorited: false, message: 'Eliminat din favorite' });
    } catch (error) {
        console.error('Remove favorite error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/users
 * Get all users (Admin only)
 */
router.get('/', requireAdmin, async (req, res) => {
    try {
        // TODO: Implement get all users from database
        res.json({
            success: true,
            message: 'Lista utilizatori (de implementat)',
            users: [],
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            error: 'Eroare server',
            message: 'Nu s-au putut prelua utilizatorii',
        });
    }
});

/**
 * PUT /api/users/:id
 * Update user (Owner or Admin only)
 */
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.params.id;
        const isOwner = req.user.id === userId;
        const isAdmin = req.user.role === 'Admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                error: 'Acces interzis',
                message: 'Nu ai permisiunea să modifici acest utilizator',
            });
        }

        // TODO: Implement update user in database
        res.json({
            success: true,
            message: 'Utilizator actualizat (de implementat)',
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            error: 'Eroare server',
            message: 'Nu s-a putut actualiza utilizatorul',
        });
    }
});

/**
 * DELETE /api/users/:id
 * Delete user (Admin only)
 */
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        // TODO: Implement delete user from database
        res.json({
            success: true,
            message: 'Utilizator șters (de implementat)',
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            error: 'Eroare server',
            message: 'Nu s-a putut șterge utilizatorul',
        });
    }
});

// ============================================================
// EVENT INTERESTS (Facebook-style "Interested")
// ============================================================

/**
 * GET /api/users/my-interests
 * Get events the user is interested in
 */
router.get('/my-interests', requireAuth, async (req, res) => {
    try {
        const interests = await db
            .select({
                interestId: intereseEvenimente.id,
                eventId: evenimente.id,
                titlu: evenimente.titlu,
                dataStart: evenimente.dataStart,
                tipEveniment: evenimente.tipEveniment,
                descriere: evenimente.descriere,
                imagineUrl: evenimente.imagineUrl,
                numeLocatie: locatiiPublice.numeLoc,
                orasLocatie: locatiiPublice.orasLoc,
            })
            .from(intereseEvenimente)
            .leftJoin(evenimente, eq(intereseEvenimente.codUnicEveniment, evenimente.id))
            .leftJoin(locatiiPublice, eq(evenimente.codUnicLocatie, locatiiPublice.codUnicLocatie))
            .where(eq(intereseEvenimente.codUnicUtilizator, req.user.id))
            .orderBy(desc(intereseEvenimente.dataInteresului));

        res.json({ success: true, count: interests.length, data: interests });
    } catch (error) {
        console.error('Get my interests error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/users/my-interests/:eventId
 * Mark event as interested
 */
router.post('/my-interests/:eventId', requireAuth, async (req, res) => {
    try {
        const { eventId } = req.params;

        // Check if already interested
        const existing = await db
            .select()
            .from(intereseEvenimente)
            .where(eq(intereseEvenimente.codUnicUtilizator, req.user.id))
            .all();
        const alreadyInterested = existing.find(i => i.codUnicEveniment === eventId);

        if (alreadyInterested) {
            return res.json({ success: true, interested: true, message: 'Deja marcat ca interesat' });
        }

        await db.insert(intereseEvenimente).values({
            id: uuidv4(),
            codUnicUtilizator: req.user.id,
            codUnicEveniment: eventId,
        });

        res.json({ success: true, interested: true, message: 'Eveniment adăugat la interese!' });
    } catch (error) {
        console.error('Add interest error:', error);
        res.status(500).json({ success: false, error: 'Eroare la marcarea interesului' });
    }
});

/**
 * DELETE /api/users/my-interests/:eventId
 * Remove interest in event
 */
router.delete('/my-interests/:eventId', requireAuth, async (req, res) => {
    try {
        const { eventId } = req.params;

        await db
            .delete(intereseEvenimente)
            .where(eq(intereseEvenimente.codUnicEveniment, eventId));

        res.json({ success: true, interested: false, message: 'Interes eliminat' });
    } catch (error) {
        console.error('Remove interest error:', error);
        res.status(500).json({ success: false, error: 'Eroare la eliminarea interesului' });
    }
});

// ============================================================
// ALL LOYALTY CARD TIERS
// ============================================================

/**
 * GET /api/users/card-tiers
 * Get all card tiers for the loyalty card progression display
 */
router.get('/card-tiers', requireAuth, async (req, res) => {
    try {
        const tiers = await db.select().from(cardFidelitate);
        res.json({ success: true, data: tiers });
    } catch (error) {
        console.error('Get card tiers error:', error);
        res.status(500).json({ success: false, error: 'Eroare la preluarea nivelurilor cardului' });
    }
});

export default router;
