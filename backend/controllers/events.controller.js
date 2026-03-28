import { db } from '../db/db.js';
import { evenimente, locatiiPublice, tipuriBilete, favoriteLocatii, user } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { createEventSchema, updateEventSchema } from '../validators/schemas.js';
import { v4 as uuidv4 } from 'uuid';
import { sendNewEventAtFavorite } from '../lib/mailer.js';

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
                intervaleOrare: evenimente.intervaleOrare,
            })
            .from(evenimente)
            .leftJoin(locatiiPublice, eq(evenimente.codUnicLocatie, locatiiPublice.codUnicLocatie))
            .orderBy(desc(evenimente.dataStart));

        const parsedEvents = events.map(ev => ({
            ...ev,
            intervaleOrare: ev.intervaleOrare ? JSON.parse(ev.intervaleOrare) : []
        }));

        res.json({ success: true, count: events.length, data: parsedEvents });
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
                intervaleOrare: evenimente.intervaleOrare,
            })
            .from(evenimente)
            .leftJoin(locatiiPublice, eq(evenimente.codUnicLocatie, locatiiPublice.codUnicLocatie))
            .where(eq(evenimente.id, id))
            .limit(1);

        if (!event) {
            return res.status(404).json({ success: false, error: 'Evenimentul nu a fost găsit' });
        }

        // Fetch ticket types for the event (daca nu e gratuit)
        const tickets = event.isGratuit
            ? []
            : await db
                .select()
                .from(tipuriBilete)
                .where(eq(tipuriBilete.codUnicEveniment, id));

        event.intervaleOrare = event.intervaleOrare ? JSON.parse(event.intervaleOrare) : [];

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
            ...validation.data,
            intervaleOrare: validation.data.intervaleOrare ? JSON.stringify(validation.data.intervaleOrare) : '[]'
        });

        res.status(201).json({
            success: true,
            data: { id: newEventId, ...validation.data },
            message: 'Eveniment creat cu succes'
        });

        // Send email to users who have this location as favorite (fire-and-forget)
        if (validation.data.codUnicLocatie) {
            notifyFavoriteUsersAboutEvent(validation.data.codUnicLocatie, {
                eventTitle: validation.data.titlu,
                eventType: validation.data.tipEveniment || 'General',
                dataStart: validation.data.dataStart,
            }).catch(err => console.error('Notify favorites email error:', err.message));
        }
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
            .set({
                ...validation.data,
                intervaleOrare: validation.data.intervaleOrare ? JSON.stringify(validation.data.intervaleOrare) : '[]'
            })
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

        // Sterge biletele evenimentului inainte
        await db.delete(tipuriBilete).where(eq(tipuriBilete.codUnicEveniment, id));
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

// ─── Helper: notify users who favorited a location about a new event ─────────
async function notifyFavoriteUsersAboutEvent(locationId, { eventTitle, eventType, dataStart }) {
    const [loc] = await db.select({ numeLoc: locatiiPublice.numeLoc })
        .from(locatiiPublice).where(eq(locatiiPublice.codUnicLocatie, locationId)).limit(1);
    if (!loc) return;

    const favUsers = await db.select({ email: user.email })
        .from(favoriteLocatii)
        .leftJoin(user, eq(favoriteLocatii.codUnicUtilizator, user.id))
        .where(eq(favoriteLocatii.codUnicLocatie, locationId));

    for (const u of favUsers) {
        if (!u.email) continue;
        try {
            await sendNewEventAtFavorite(u.email, {
                eventTitle, eventType, locationName: loc.numeLoc, dataStart,
            });
        } catch (e) {
            console.error(`Email to ${u.email} failed:`, e.message);
        }
    }
}
