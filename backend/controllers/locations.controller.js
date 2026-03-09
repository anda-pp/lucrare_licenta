import { db } from '../db/db.js';
import { locatiiPublice, recenzii, tipuriBilete } from '../db/schema.js';
import { eq, sql, and, like } from 'drizzle-orm';
import { createLocationSchema, updateLocationSchema } from '../validators/schemas.js';
import crypto from 'crypto';

/**
 * GET /api/locations
 * Get all locations with optional filters
 */
export const getAllLocations = async (req, res) => {
    try {
        const { type, status, search } = req.query;

        let query = db
            .select({
                codUnicLocatie: locatiiPublice.codUnicLocatie,
                tipLocatie: locatiiPublice.tipLocatie,
                numeLoc: locatiiPublice.numeLoc,
                orasLoc: locatiiPublice.orasLoc,
                judet: locatiiPublice.judet,
                adresa: locatiiPublice.adresa,
                orar: locatiiPublice.orar,
                scurtaDescriere: locatiiPublice.scurtaDescriere,
                siteOficial: locatiiPublice.siteOficial,
                locatieHarta: locatiiPublice.locatieHarta,
                statusLocatie: locatiiPublice.statusLocatie,
                imagineUrl: locatiiPublice.imagineUrl,
                reviewCount: sql`COUNT(DISTINCT ${recenzii.numarRecenzie})`.as('reviewCount'),
                avgRating: sql`ROUND(AVG(${recenzii.rating}), 1)`.as('avgRating'),
            })
            .from(locatiiPublice)
            .leftJoin(recenzii, eq(locatiiPublice.codUnicLocatie, recenzii.codUnicLocatie))
            .groupBy(locatiiPublice.codUnicLocatie);

        // Apply filters
        const conditions = [];

        if (type) {
            conditions.push(eq(locatiiPublice.tipLocatie, type));
        }

        if (status) {
            conditions.push(eq(locatiiPublice.statusLocatie, status));
        }

        if (search) {
            conditions.push(like(locatiiPublice.numeLoc, `%${search}%`));
        }

        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }

        const locations = await query;

        res.json({
            success: true,
            count: locations.length,
            data: locations,
        });
    } catch (error) {
        console.error('Get locations error:', error);
        res.status(500).json({
            success: false,
            error: 'Nu s-au putut prelua locațiile',
        });
    }
};

/**
 * GET /api/locations/:id
 * Get single location with reviews and ticket types
 */
export const getLocationById = async (req, res) => {
    try {
        const { id } = req.params;

        // Get location
        const location = await db
            .select()
            .from(locatiiPublice)
            .where(eq(locatiiPublice.codUnicLocatie, id))
            .limit(1);

        if (location.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Locația nu a fost găsită',
            });
        }

        // Get reviews
        const locationReviews = await db
            .select()
            .from(recenzii)
            .where(eq(recenzii.codUnicLocatie, id));

        // Get ticket types
        const ticketTypes = await db
            .select()
            .from(tipuriBilete)
            .where(eq(tipuriBilete.codUnicLocatie, id));

        res.json({
            success: true,
            data: {
                ...location[0],
                reviews: locationReviews,
                ticketTypes: ticketTypes,
            },
        });
    } catch (error) {
        console.error('Get location error:', error);
        res.status(500).json({
            success: false,
            error: 'Nu s-a putut prelua locația',
        });
    }
};

/**
 * POST /api/locations
 * Create new location (Admin only)
 */
export const createLocation = async (req, res) => {
    try {
        // Validate input
        const validatedData = createLocationSchema.parse(req.body);

        // Generate unique ID
        const codUnicLocatie = crypto.randomUUID();

        // Insert location
        await db.insert(locatiiPublice).values({
            codUnicLocatie,
            ...validatedData,
        });

        res.status(201).json({
            success: true,
            message: 'Locația a fost creată cu succes',
            data: { codUnicLocatie },
        });
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                error: 'Date invalide',
                details: error.errors,
            });
        }

        console.error('Create location error:', error);
        res.status(500).json({
            success: false,
            error: 'Nu s-a putut crea locația',
        });
    }
};

/**
 * PUT /api/locations/:id
 * Update location (Admin or Personal)
 */
export const updateLocation = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate input
        const validatedData = updateLocationSchema.parse(req.body);

        // Check if location exists
        const existing = await db
            .select()
            .from(locatiiPublice)
            .where(eq(locatiiPublice.codUnicLocatie, id))
            .limit(1);

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Locația nu a fost găsită',
            });
        }

        // Update location
        await db
            .update(locatiiPublice)
            .set(validatedData)
            .where(eq(locatiiPublice.codUnicLocatie, id));

        res.json({
            success: true,
            message: 'Locația a fost actualizată cu succes',
        });
    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                error: 'Date invalide',
                details: error.errors,
            });
        }

        console.error('Update location error:', error);
        res.status(500).json({
            success: false,
            error: 'Nu s-a putut actualiza locația',
        });
    }
};

/**
 * DELETE /api/locations/:id
 * Delete location permanently (Admin only)
 */
export const deleteLocation = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if location exists
        const existing = await db
            .select()
            .from(locatiiPublice)
            .where(eq(locatiiPublice.codUnicLocatie, id))
            .limit(1);

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Locația nu a fost găsită',
            });
        }

        // Delete associated ticket types first
        await db
            .delete(tipuriBilete)
            .where(eq(tipuriBilete.codUnicLocatie, id));

        // Delete associated reviews
        await db
            .delete(recenzii)
            .where(eq(recenzii.codUnicLocatie, id));

        // Delete location permanently
        await db
            .delete(locatiiPublice)
            .where(eq(locatiiPublice.codUnicLocatie, id));

        res.json({
            success: true,
            message: 'Locația a fost ștearsă cu succes',
        });
    } catch (error) {
        console.error('Delete location error:', error);
        res.status(500).json({
            success: false,
            error: 'Nu s-a putut șterge locația',
        });
    }
};

// ---- TICKETS MANAGEMENT ----

/** GET /api/locations/:id/tickets */
export const getTicketsByLocation = async (req, res) => {
    try {
        const { id } = req.params;
        const tickets = await db.select().from(tipuriBilete).where(eq(tipuriBilete.codUnicLocatie, id));
        res.json({ success: true, data: tickets });
    } catch (error) {
        console.error('Get tickets error:', error);
        res.status(500).json({ success: false, error: 'Nu s-au putut prelua biletele' });
    }
};

/** POST /api/locations/:id/tickets */
export const createTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { tipBilet, pret } = req.body;
        if (!tipBilet || pret === undefined) {
            return res.status(400).json({ success: false, error: 'tipBilet și pret sunt obligatorii' });
        }
        const newId = crypto.randomUUID();
        await db.insert(tipuriBilete).values({ codUnicTipBilet: newId, codUnicLocatie: id, tipBilet, pret });
        res.status(201).json({ success: true, data: { codUnicTipBilet: newId, tipBilet, pret } });
    } catch (error) {
        console.error('Create ticket error:', error);
        res.status(500).json({ success: false, error: 'Nu s-a putut crea biletul' });
    }
};

/** PUT /api/locations/tickets/:ticketId */
export const updateTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { tipBilet, pret } = req.body;
        await db.update(tipuriBilete).set({ tipBilet, pret }).where(eq(tipuriBilete.codUnicTipBilet, ticketId));
        res.json({ success: true, message: 'Bilet actualizat' });
    } catch (error) {
        console.error('Update ticket error:', error);
        res.status(500).json({ success: false, error: 'Nu s-a putut actualiza biletul' });
    }
};

/** DELETE /api/locations/tickets/:ticketId */
export const deleteTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;
        await db.delete(tipuriBilete).where(eq(tipuriBilete.codUnicTipBilet, ticketId));
        res.json({ success: true, message: 'Bilet șters' });
    } catch (error) {
        console.error('Delete ticket error:', error);
        res.status(500).json({ success: false, error: 'Nu s-a putut șterge biletul' });
    }
};

