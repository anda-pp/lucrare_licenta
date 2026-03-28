import express from 'express';
import { requireAdmin } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateBody.js';
import { createTicketTypeSchema, updateTicketTypeSchema } from '../validators/schemas.js';
import { db } from '../db/db.js';
import { eq, and, sql, desc } from 'drizzle-orm';
import { comenzi, rezervariEvenimente, evenimente, recenzii, locatiiPublice, bileteCumparate, user, tipuriBilete, favoriteLocatii } from '../db/schema.js';
import { sendNewEventAtFavorite } from '../lib/mailer.js';

const router = express.Router();

// Middleware local pentru a ne asigura ca adminul are un muzeu valid alocat
const requireMuseumId = async (req, res, next) => {
    try {
        const u = await db.select({ muzeuId: user.muzeuId }).from(user).where(eq(user.id, req.user.id)).get();
        if (!u || !u.muzeuId) {
            return res.status(403).json({
                success: false,
                error: 'Acces interzis: Nu aveți un muzeu alocat acestui cont.'
            });
        }
        req.muzeuId = u.muzeuId;
        next();
    } catch(e) {
        return res.status(500).json({ success: false, error: 'Eroare la verificarea identității.' });
    }
};

// Aplicare Middleware-uri
router.use(requireAdmin);
router.use(requireMuseumId);

/**
 * GET /api/museum-admin/dashboard
 * Statistici specifice muzeului manageriat
 */
router.get('/dashboard', async (req, res) => {
    try {
        const mId = req.muzeuId;

        // 1. Numar Evenimente pentru acest muzeu
        const eventsResult = await db.select({ count: sql`COUNT(*)` })
            .from(evenimente)
            .where(eq(evenimente.codUnicLocatie, mId)).get();

        // 2. Numar Recenzii strict pe locatie
        const revResult = await db.select({ count: sql`COUNT(*)` })
            .from(recenzii)
            .where(eq(recenzii.codUnicLocatie, mId)).get();

        // 3. Rezervari pe evenimentele acestui muzeu
        // (Trebuie un JOIN la Evenimente)
        const rezervari = await db.select({ count: sql`COUNT(*)` })
            .from(rezervariEvenimente)
            .leftJoin(evenimente, eq(rezervariEvenimente.eventId, evenimente.id))
            .where(eq(evenimente.codUnicLocatie, mId)).get();

        // 4. Comenzi pntru muzeul nostru.
        // Comanda in sine nu are locatie, dar biletele cumparate o au prin `tipuriBilete`
        const ordersRows = await db.select({
                orderId: comenzi.numarComanda,
                total: comenzi.totalPlata
            })
            .from(comenzi)
            .leftJoin(bileteCumparate, eq(comenzi.numarComanda, bileteCumparate.numarComanda))
            .leftJoin(tipuriBilete, eq(bileteCumparate.codUnicTipBilet, tipuriBilete.codUnicTipBilet))
            .where(eq(tipuriBilete.codUnicLocatie, mId))
            .groupBy(comenzi.numarComanda)
            .all();

        const ordersCount = ordersRows.length;
        const totalRevenue = ordersRows.reduce((sum, order) => sum + order.total, 0);

        // 5. Ultimele 5 comenzi strict pnt muzeu
        const recentOrders = await db.select({
                numarComanda: comenzi.numarComanda,
                totalPlata: comenzi.totalPlata,
                dataComanda: comenzi.dataComanda,
                statusPlata: comenzi.statusPlata,
                userName: user.name
            })
            .from(comenzi)
            .leftJoin(bileteCumparate, eq(comenzi.numarComanda, bileteCumparate.numarComanda))
            .leftJoin(tipuriBilete, eq(bileteCumparate.codUnicTipBilet, tipuriBilete.codUnicTipBilet))
            .leftJoin(user, eq(comenzi.codUnicUtilizator, user.id))
            .where(eq(tipuriBilete.codUnicLocatie, mId))
            .groupBy(comenzi.numarComanda)
            .orderBy(desc(comenzi.numarComanda))
            .limit(5)
            .all();

        res.json({
            success: true,
            data: {
                events: eventsResult.count,
                reviews: revResult.count,
                reservations: rezervari.count,
                orders: ordersCount,
                revenue: totalRevenue,
                recentOrders
            }
        });
    } catch (error) {
        console.error('Error fetching scoped dashboard stats:', error);
        res.status(500).json({ success: false, error: 'Eroare la preluarea serverului local.' });
    }
});

/**
 * GET /api/museum-admin/my-museum
 * Preluare date profil Muzeu, Galerii Imagini si Tipuri Bilete
 */
router.get('/my-museum', async (req, res) => {
    try {
        const mId = req.muzeuId;

        const muzeu = await db.select().from(locatiiPublice).where(eq(locatiiPublice.codUnicLocatie, mId)).get();
        if (!muzeu) return res.status(404).json({ success: false, error: 'Locația nu a fost găsită.' });

        // Bilete ale locatiei (exclude biletele de eveniment)
        const bilete = await db.select().from(tipuriBilete)
            .where(and(eq(tipuriBilete.codUnicLocatie, mId), sql`${tipuriBilete.codUnicEveniment} IS NULL`))
            .all();

        // Putem incude imagini in viitor, momentan doar array gol daca nu avem inca rutele gata
        const imagini = []; 

        res.json({
            success: true,
            data: {
                ...muzeu,
                bilete,
                imagini
            }
        });
    } catch (e) {
        console.error('Error fetching my-museum:', e);
        res.status(500).json({ success: false, error: 'Eroare la preluarea datelor locației.' });
    }
});

/**
 * PUT /api/museum-admin/my-museum
 * Actualizare profil Muzeu (orar, descriere, imagini de coperta, link)
 */
router.put('/my-museum', async (req, res) => {
    try {
        const mId = req.muzeuId;
        const { orar, scurtaDescriere, siteOficial, adresa } = req.body;

        await db.update(locatiiPublice)
            .set({
                orar: orar || null,
                scurtaDescriere: scurtaDescriere || null,
                siteOficial: siteOficial || null,
                adresa: adresa || null
            })
            .where(eq(locatiiPublice.codUnicLocatie, mId))
            .run();

        res.json({ success: true, message: 'Profilul a fost actualizat cu succes.' });
    } catch (e) {
        console.error('Error updating my-museum:', e);
        res.status(500).json({ success: false, error: 'Eroare internă la actualizarea profilului.' });
    }
});

/**
 * POST /api/museum-admin/tickets
 * Adaugare nou pachet de bilete curentului muzeu
 */
router.post('/tickets', validateBody(createTicketTypeSchema), async (req, res) => {
    try {
        const { tipBilet, pret } = req.body;
        if (!tipBilet || pret === undefined) {
            return res.status(400).json({ success: false, error: 'Tipul biletului și prețul sunt obligatorii.' });
        }

        const newId = crypto.randomUUID();
        await db.insert(tipuriBilete).values({
            codUnicTipBilet: newId,
            codUnicLocatie: req.muzeuId,
            tipBilet,
            pret: parseFloat(pret)
        }).run();

        res.json({ success: true, message: 'Bilet adăugat cu succes.', id: newId });
    } catch (e) {
        console.error('Error adding ticket:', e);
        res.status(500).json({ success: false, error: 'Eroare la salvarea biletului.' });
    }
});

/**
 * PUT /api/museum-admin/tickets/:id
 * Actualizare pachet bilete
 */
router.put('/tickets/:id', validateBody(updateTicketTypeSchema), async (req, res) => {
    try {
        const { id } = req.params;
        const { tipBilet, pret } = req.body;
        
        if (!tipBilet || pret === undefined) {
            return res.status(400).json({ success: false, error: 'Date invalide pentru actualizare.' });
        }

        const ticket = await db.select().from(tipuriBilete).where(eq(tipuriBilete.codUnicTipBilet, id)).get();
        if (!ticket || ticket.codUnicLocatie !== req.muzeuId) {
            return res.status(403).json({ success: false, error: 'Acces interzis la acest tip de bilet.' });
        }

        await db.update(tipuriBilete)
            .set({ tipBilet, pret: parseFloat(pret) })
            .where(eq(tipuriBilete.codUnicTipBilet, id))
            .run();

        res.json({ success: true, message: 'Bilet actualizat cu succes.' });
    } catch (e) {
        console.error('Error updating ticket:', e);
        res.status(500).json({ success: false, error: 'Eroare internă la actualizarea biletului.' });
    }
});

/**
 * DELETE /api/museum-admin/tickets/:id
 * Stergere pachet bilete
 */
router.delete('/tickets/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Asigurare ca biletul ii apartine acestui muzeu
        const ticket = await db.select().from(tipuriBilete).where(eq(tipuriBilete.codUnicTipBilet, id)).get();
        if (!ticket || ticket.codUnicLocatie !== req.muzeuId) {
            return res.status(403).json({ success: false, error: 'Acces interzis la acest tip de bilet.' });
        }

        await db.delete(tipuriBilete).where(eq(tipuriBilete.codUnicTipBilet, id)).run();
        res.json({ success: true, message: 'Bilet șters cu succes.' });
    } catch (e) {
        console.error('Error deleting ticket:', e);
        res.status(500).json({ success: false, error: 'Nu se poate șterge. Biletul este posibil folosit în comenzi active.' });
    }
});

// ==========================================
// 1. EVENIMENTE (CRUD STRICT PENTRU MUZEU)
// ==========================================

router.get('/events', async (req, res) => {
    try {
        const eventsList = await db.select()
            .from(evenimente)
            .where(eq(evenimente.codUnicLocatie, req.muzeuId))
            .orderBy(desc(evenimente.dataStart))
            .all();

        // Ataseaza biletele relational pentru fiecare eveniment
        const allTickets = await db.select().from(tipuriBilete)
            .where(eq(tipuriBilete.codUnicLocatie, req.muzeuId))
            .all();

        const eventsWithTickets = eventsList.map(ev => ({
            ...ev,
            ticketTypes: allTickets
                .filter(t => t.codUnicEveniment === ev.id)
                .map(t => ({ tip: t.tipBilet, pret: t.pret, codUnicTipBilet: t.codUnicTipBilet }))
        }));

        res.json({ success: true, data: eventsWithTickets });
    } catch (error) {
        console.error('Error fetching museum events:', error);
        res.status(500).json({ success: false, error: 'Eroare la preluarea evenimentelor.' });
    }
});

router.post('/events', async (req, res) => {
    try {
        const { titlu, descriere, dataStart, dataSfarsit, tipEveniment, isGratuit, intervaleOrare, bilete } = req.body;
        if (!titlu || !dataStart) return res.status(400).json({ success: false, error: 'Titlul și data de început sunt obligatorii.' });

        const newId = crypto.randomUUID();
        const start = isNaN(Date.parse(dataStart)) ? new Date() : new Date(dataStart);
        const end = dataSfarsit ? (isNaN(Date.parse(dataSfarsit)) ? null : new Date(dataSfarsit)) : null;

        await db.insert(evenimente).values({
            id: newId,
            codUnicLocatie: req.muzeuId,
            titlu,
            descriere,
            dataStart: start,
            dataSfarsit: end,
            tipEveniment: tipEveniment || 'General',
            isGratuit: isGratuit ? 1 : 0,
            intervaleOrare: intervaleOrare ? JSON.stringify(intervaleOrare) : null,
        }).run();

        // Daca evenimentul nu e gratuit, salveaza biletele in tipuri_bilete
        if (!isGratuit && bilete && bilete.length > 0) {
            for (const b of bilete) {
                if (!b.tip || b.pret === undefined) continue;
                await db.insert(tipuriBilete).values({
                    codUnicTipBilet: crypto.randomUUID(),
                    codUnicLocatie: req.muzeuId,
                    codUnicEveniment: newId,
                    tipBilet: b.tip,
                    pret: parseFloat(b.pret)
                }).run();
            }
        }

        res.json({ success: true, message: 'Eveniment creat.', data: { id: newId } });

        // Notify users who favorited this museum (fire-and-forget)
        (async () => {
            try {
                const [loc] = await db.select({ numeLoc: locatiiPublice.numeLoc })
                    .from(locatiiPublice).where(eq(locatiiPublice.codUnicLocatie, req.muzeuId)).limit(1);
                if (!loc) return;

                const favUsers = await db.select({ email: user.email })
                    .from(favoriteLocatii)
                    .leftJoin(user, eq(favoriteLocatii.codUnicUtilizator, user.id))
                    .where(eq(favoriteLocatii.codUnicLocatie, req.muzeuId));

                for (const u of favUsers) {
                    if (!u.email) continue;
                    await sendNewEventAtFavorite(u.email, {
                        eventTitle: titlu,
                        eventType: tipEveniment || 'General',
                        locationName: loc.numeLoc,
                        dataStart: start,
                    }).catch(e => console.error(`Email to ${u.email} failed:`, e.message));
                }
            } catch (e) { console.error('Notify favorites error:', e.message); }
        })();
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ success: false, error: 'Eroare la crearea evenimentului.' });
    }
});

router.put('/events/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const ev = await db.select().from(evenimente).where(eq(evenimente.id, id)).get();
        if (!ev || ev.codUnicLocatie !== req.muzeuId) {
            return res.status(403).json({ success: false, error: 'Evenimentul nu aparține de muzeul curent.' });
        }

        const { titlu, descriere, dataStart, dataSfarsit, tipEveniment, isGratuit, intervaleOrare, bilete } = req.body;
        const start = dataStart ? new Date(dataStart) : ev.dataStart;
        const end = dataSfarsit ? new Date(dataSfarsit) : null;

        await db.update(evenimente).set({
            titlu: titlu || ev.titlu,
            descriere: descriere !== undefined ? descriere : ev.descriere,
            dataStart: start,
            dataSfarsit: end,
            tipEveniment: tipEveniment || ev.tipEveniment,
            isGratuit: isGratuit ? 1 : 0,
            intervaleOrare: intervaleOrare ? JSON.stringify(intervaleOrare) : null,
        }).where(eq(evenimente.id, id)).run();

        // Actualizeaza biletele in tipuri_bilete (sterge si re-insereaza)
        await db.delete(tipuriBilete).where(eq(tipuriBilete.codUnicEveniment, id)).run();
        if (!isGratuit && bilete && bilete.length > 0) {
            for (const b of bilete) {
                if (!b.tip || b.pret === undefined) continue;
                await db.insert(tipuriBilete).values({
                    codUnicTipBilet: crypto.randomUUID(),
                    codUnicLocatie: req.muzeuId,
                    codUnicEveniment: id,
                    tipBilet: b.tip,
                    pret: parseFloat(b.pret)
                }).run();
            }
        }

        res.json({ success: true, message: 'Eveniment actualizat.' });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ success: false, error: 'Eroare la actualizarea evenimentului.' });
    }
});

router.delete('/events/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const ev = await db.select().from(evenimente).where(eq(evenimente.id, id)).get();
        if (!ev || ev.codUnicLocatie !== req.muzeuId) {
            return res.status(403).json({ success: false, error: 'Inexistent sau acces interzis.' });
        }
        // Sterge biletele evenimentului inainte de a sterge evenimentul
        await db.delete(tipuriBilete).where(eq(tipuriBilete.codUnicEveniment, id)).run();
        await db.delete(evenimente).where(eq(evenimente.id, id)).run();
        res.json({ success: true, message: 'Eveniment șters complet.' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ success: false, error: 'Eroare la ștergerea evenimentului.' });
    }
});

// ==========================================
// 2. COMENZI BILETE (READ-ONLY)
// ==========================================

router.get('/orders', async (req, res) => {
    try {
        const fullOrders = await db.select({
                numarComanda: comenzi.numarComanda,
                totalPlata: comenzi.totalPlata,
                dataComanda: comenzi.dataComanda,
                statusPlata: comenzi.statusPlata,
                userName: user.name,
                userEmail: user.email
            })
            .from(comenzi)
            .innerJoin(bileteCumparate, eq(comenzi.numarComanda, bileteCumparate.numarComanda))
            .innerJoin(tipuriBilete, eq(bileteCumparate.codUnicTipBilet, tipuriBilete.codUnicTipBilet))
            .leftJoin(user, eq(comenzi.codUnicUtilizator, user.id))
            .where(eq(tipuriBilete.codUnicLocatie, req.muzeuId))
            .groupBy(comenzi.numarComanda)
            .orderBy(desc(comenzi.numarComanda))
            .all();

        res.json({ success: true, data: fullOrders });
    } catch (error) {
        console.error('Error fetching admin orders:', error);
        res.status(500).json({ success: false, error: 'Eroare la preluarea comenzilor.' });
    }
});

// ==========================================
// 3. REZERVARI EVENIMENTE (READ-ONLY)
// ==========================================

router.get('/reservations', async (req, res) => {
    try {
        const rezList = await db.select({
                id: rezervariEvenimente.id,
                numeRezervant: rezervariEvenimente.numeRezervant,
                nrPersoane: rezervariEvenimente.nrPersoane,
                dataRezervare: rezervariEvenimente.dataRezervare,
                ziuaAleasa: rezervariEvenimente.ziuaAleasa,
                intervalOrar: rezervariEvenimente.intervalOrar,
                eventTitlu: evenimente.titlu,
                userName: user.name,
                userEmail: user.email
            })
            .from(rezervariEvenimente)
            .innerJoin(evenimente, eq(rezervariEvenimente.eventId, evenimente.id))
            .leftJoin(user, eq(rezervariEvenimente.userId, user.id))
            .where(eq(evenimente.codUnicLocatie, req.muzeuId))
            .orderBy(desc(rezervariEvenimente.dataRezervare))
            .all();

        res.json({ success: true, data: rezList });
    } catch (error) {
        console.error('Error fetching admin reservations:', error);
        res.status(500).json({ success: false, error: 'Eroare la preluarea rezervărilor.' });
    }
});

// ==========================================
// 4. RECENZII (READ-ONLY)
// ==========================================

router.get('/reviews', async (req, res) => {
    try {
        const revList = await db.select({
                id: recenzii.numarRecenzie,
                rating: recenzii.rating,
                comentariu: recenzii.descriereRecenzie,
                data: recenzii.dataRecenzie,
                userName: user.name,
                userEmail: user.email
            })
            .from(recenzii)
            .leftJoin(user, eq(recenzii.codUnicUtilizator, user.id))
            .where(eq(recenzii.codUnicLocatie, req.muzeuId))
            .orderBy(desc(recenzii.dataRecenzie))
            .all();

        res.json({ success: true, data: revList });
    } catch (error) {
        console.error('Error fetching admin reviews:', error);
        res.status(500).json({ success: false, error: 'Eroare la preluarea recenziilor.' });
    }
});

export default router;
