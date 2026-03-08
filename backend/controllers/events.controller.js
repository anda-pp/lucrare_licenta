import { db } from '../db/db.js';
import { evenimente, locatiiPublice, tipuriBilete } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { createEventSchema, updateEventSchema } from '../validators/schemas.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/events
 * Obține toate evenimentele, inclusiv detaliile locației dacă există
 */
export const getAllEvents = async (req, res) => {
    try {
        const events = await db
            .select({
                id: evenimente.id,
                titlu: evenimente.titlu,
                descriere: evenimente.descriere,
                dataStart: evenimente.dataStart,
                dataSfarsit: evenimente.dataSfarsit,
                tipEveniment: evenimente.tipEveniment,
                imagineUrl: evenimente.imagineUrl,
                codUnicLocatie: evenimente.codUnicLocatie,
                numeLocatie: locatiiPublice.numeLoc,
                orasLocatie: locatiiPublice.orasLoc,
                isGratuit: evenimente.isGratuit,
            })
            .from(evenimente)
            .leftJoin(locatiiPublice, eq(evenimente.codUnicLocatie, locatiiPublice.codUnicLocatie))
            .orderBy(desc(evenimente.dataStart));

        res.json({ success: true, count: events.length, data: events });
    } catch (error) {
        console.error('Eroare preluare evenimente:', error);
        res.status(500).json({ success: false, error: 'Eroare la preluarea evenimentelor' });
    }
};

/**
 * GET /api/events/:id
 * Obține un eveniment specific după ID
 */
export const getEventById = async (req, res) => {
    try {
        const { id } = req.params;
        const [event] = await db
            .select({
                id: evenimente.id,
                titlu: evenimente.titlu,
                descriere: evenimente.descriere,
                dataStart: evenimente.dataStart,
                dataSfarsit: evenimente.dataSfarsit,
                tipEveniment: evenimente.tipEveniment,
                imagineUrl: evenimente.imagineUrl,
                codUnicLocatie: evenimente.codUnicLocatie,
                numeLocatie: locatiiPublice.numeLoc,
                orasLocatie: locatiiPublice.orasLoc,
                isGratuit: evenimente.isGratuit,
            })
            .from(evenimente)
            .leftJoin(locatiiPublice, eq(evenimente.codUnicLocatie, locatiiPublice.codUnicLocatie))
            .where(eq(evenimente.id, id))
            .limit(1);

        if (!event) {
            return res.status(404).json({ success: false, error: 'Evenimentul nu a fost găsit' });
        }

        // Fetch ticket types for the event's location
        const tickets = await db
            .select()
            .from(tipuriBilete)
            .where(eq(tipuriBilete.codUnicLocatie, event.codUnicLocatie));

        res.json({ success: true, data: { ...event, ticketTypes: tickets } });
    } catch (error) {
        console.error('Eroare preluare eveniment:', error);
        res.status(500).json({ success: false, error: 'Eroare la preluarea evenimentului' });
    }
};

/**
 * POST /api/events
 * Crează un eveniment (Doar Admin/Staff)
 */
export const createEvent = async (req, res) => {
    try {
        const validation = createEventSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Date invalide',
                details: validation.error.format(),
            });
        }

        const newEventId = uuidv4();
        await db.insert(evenimente).values({
            id: newEventId,
            ...validation.data
        });

        res.status(201).json({
            success: true,
            data: { id: newEventId, ...validation.data },
            message: 'Eveniment creat cu succes'
        });
    } catch (error) {
        console.error('Eroare creare eveniment:', error);
        res.status(500).json({ success: false, error: 'Eroare la crearea evenimentului' });
    }
};

/**
 * PUT /api/events/:id
 * Actualizează un eveniment existent (Doar Admin/Staff)
 */
export const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const validation = updateEventSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Date invalide',
                details: validation.error.format(),
            });
        }

        // Check if event exists
        const [existing] = await db.select().from(evenimente).where(eq(evenimente.id, id)).limit(1);
        if (!existing) {
            return res.status(404).json({ success: false, error: 'Evenimentul nu a fost găsit' });
        }

        await db.update(evenimente)
            .set(validation.data)
            .where(eq(evenimente.id, id));

        res.json({
            success: true,
            message: 'Eveniment actualizat cu succes'
        });
    } catch (error) {
        console.error('Eroare actualizare eveniment:', error);
        res.status(500).json({ success: false, error: 'Eroare la actualizarea evenimentului' });
    }
};

/**
 * DELETE /api/events/:id
 * Șterge un eveniment (Doar Admin)
 */
export const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if event exists
        const [existing] = await db.select().from(evenimente).where(eq(evenimente.id, id)).limit(1);
        if (!existing) {
            return res.status(404).json({ success: false, error: 'Evenimentul nu a fost găsit' });
        }

        await db.delete(evenimente).where(eq(evenimente.id, id));

        res.json({
            success: true,
            message: 'Eveniment șters cu succes'
        });
    } catch (error) {
        console.error('Eroare ștergere eveniment:', error);
        res.status(500).json({ success: false, error: 'Eroare la ștergerea evenimentului' });
    }
};
