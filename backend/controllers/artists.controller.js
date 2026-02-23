import { db } from '../db/db.js';
import { artisti } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { createArtistSchema, updateArtistSchema } from '../validators/schemas.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/artists
 * Obține toți artiștii
 */
export const getAllArtists = async (req, res) => {
    try {
        const _artists = await db.select().from(artisti);
        res.json({ success: true, count: _artists.length, data: _artists });
    } catch (error) {
        console.error('Eroare preluare artiști:', error);
        res.status(500).json({ success: false, error: 'Eroare la preluarea artiștilor' });
    }
};

/**
 * GET /api/artists/:id
 * Obține un artist după ID
 */
export const getArtistById = async (req, res) => {
    try {
        const { id } = req.params;
        const [artist] = await db
            .select()
            .from(artisti)
            .where(eq(artisti.id, id))
            .limit(1);

        if (!artist) {
            return res.status(404).json({ success: false, error: 'Artistul nu a fost găsit' });
        }

        res.json({ success: true, data: artist });
    } catch (error) {
        console.error('Eroare preluare artist:', error);
        res.status(500).json({ success: false, error: 'Eroare la preluarea artistului' });
    }
};

/**
 * POST /api/artists
 * Crează un artist (Doar Admin/Staff)
 */
export const createArtist = async (req, res) => {
    try {
        const validation = createArtistSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Date invalide',
                details: validation.error.format(),
            });
        }

        const newId = uuidv4();
        await db.insert(artisti).values({
            id: newId,
            ...validation.data
        });

        res.status(201).json({
            success: true,
            data: { id: newId, ...validation.data },
            message: 'Artist creat cu succes'
        });
    } catch (error) {
        console.error('Eroare creare artist:', error);
        res.status(500).json({ success: false, error: 'Eroare la crearea artistului' });
    }
};

/**
 * PUT /api/artists/:id
 * Actualizează un artist existent (Doar Admin/Staff)
 */
export const updateArtist = async (req, res) => {
    try {
        const { id } = req.params;
        const validation = updateArtistSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Date invalide',
                details: validation.error.format(),
            });
        }

        // Check if artist exists
        const [existing] = await db.select().from(artisti).where(eq(artisti.id, id)).limit(1);
        if (!existing) {
            return res.status(404).json({ success: false, error: 'Artistul nu a fost găsit' });
        }

        await db.update(artisti)
            .set(validation.data)
            .where(eq(artisti.id, id));

        res.json({
            success: true,
            message: 'Artist actualizat cu succes'
        });
    } catch (error) {
        console.error('Eroare actualizare artist:', error);
        res.status(500).json({ success: false, error: 'Eroare la actualizarea artistului' });
    }
};

/**
 * DELETE /api/artists/:id
 * Șterge un artist (Doar Admin)
 */
export const deleteArtist = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if artist exists
        const [existing] = await db.select().from(artisti).where(eq(artisti.id, id)).limit(1);
        if (!existing) {
            return res.status(404).json({ success: false, error: 'Artistul nu a fost găsit' });
        }

        await db.delete(artisti).where(eq(artisti.id, id));

        res.json({
            success: true,
            message: 'Artist șters cu succes'
        });
    } catch (error) {
        console.error('Eroare ștergere artist:', error);
        res.status(500).json({ success: false, error: 'Eroare la ștergerea artistului' });
    }
};
