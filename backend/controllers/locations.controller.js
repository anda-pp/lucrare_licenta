import { db } from '../db/db.js';
import { locatiiPublice, recenzii, tipuriBilete, user } from '../db/schema.js';
import { eq, sql, and, like } from 'drizzle-orm';
import { createLocationSchema, updateLocationSchema } from '../validators/schemas.js';
import crypto from 'crypto';
import { sendNewMuseum } from '../lib/mailer.js';

// Returnează toate locațiile cu numărul de recenzii și rating-ul mediu
// Suportă filtrare opțională după tip (Muzeu/Galerie), status și search pe nume
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

// Returnează detaliile complete ale unei locații: recenzii și tipuri de bilete
export const getLocationById = async (req, res) => {
    try {
        const { id } = req.params;

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

        const locationReviews = await db
            .select()
            .from(recenzii)
            .where(eq(recenzii.codUnicLocatie, id));

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

// Creare locație nouă — validăm cu Zod, generăm UUID și inserăm
// Dacă locația este Activă, trimitem email tuturor utilizatorilor (fire-and-forget)
export const createLocation = async (req, res) => {
    try {
        const validatedData = createLocationSchema.parse(req.body);
        const codUnicLocatie = crypto.randomUUID();

        await db.insert(locatiiPublice).values({
            codUnicLocatie,
            ...validatedData,
        });

        res.status(201).json({
            success: true,
            message: 'Locația a fost creată cu succes',
            data: { codUnicLocatie },
        });

        // Notificăm utilizatorii doar dacă locația este publicată direct ca Activă
        if (validatedData.statusLocatie === 'Activ') {
            (async () => {
                try {
                    const allUsers = await db.select({ email: user.email })
                        .from(user).where(eq(user.role, 'Utilizator'));
                    for (const u of allUsers) {
                        if (!u.email) continue;
                        await sendNewMuseum(u.email, {
                            locationName: validatedData.numeLoc,
                            city: validatedData.orasLoc,
                            type: validatedData.tipLocatie || 'Muzeu',
                        }).catch(e => console.error(`New museum email to ${u.email} failed:`, e.message));
                    }
                } catch (e) { console.error('New museum notification error:', e.message); }
            })();
        }
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

// Editare locație — verificăm că există, validăm cu Zod, actualizăm câmpurile furnizate
export const updateLocation = async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = updateLocationSchema.parse(req.body);

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

// Ștergere permanentă a unei locații — ștergem biletele și recenziile asociate mai întâi (FK manual)
export const deleteLocation = async (req, res) => {
    try {
        const { id } = req.params;

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

        // Ștergem datele asociate înainte să ștergem locația (nu avem cascade pe toate tabelele)
        await db.delete(tipuriBilete).where(eq(tipuriBilete.codUnicLocatie, id));
        await db.delete(recenzii).where(eq(recenzii.codUnicLocatie, id));
        await db.delete(locatiiPublice).where(eq(locatiiPublice.codUnicLocatie, id));

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

// Returnează tipurile de bilete de intrare pentru o locație specifică
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

// Adaugă un tip de bilet nou pentru o locație
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

// Actualizează tipul sau prețul unui bilet existent
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

// Șterge un tip de bilet din oferta locației
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
