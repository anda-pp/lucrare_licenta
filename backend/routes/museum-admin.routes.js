import express from 'express';
import { requireAdmin } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateBody.js';
import { createTicketTypeSchema, updateTicketTypeSchema } from '../validators/schemas.js';
import { db } from '../db/db.js';
import { eq, and, sql, desc } from 'drizzle-orm';
import { comenzi, rezervariEvenimente, evenimente, recenzii, locatiiPublice, bileteCumparate, user, tipuriBilete, favoriteLocatii } from '../db/schema.js';
import { sendNewEventAtFavorite } from '../lib/mailer.js';

const router = express.Router();

// Middleware local care verifică că adminul are un muzeu alocat în profilul său
// Fără muzeuId, toate operațiunile de tip museum-admin sunt blocate
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

router.use(requireAdmin);
router.use(requireMuseumId);

// Dashboard-ul administratorului de muzeu: statistici specifice locației alocate
// Calculăm separat veniturile din bilete de muzeu vs. bilete de eveniment
router.get('/dashboard', async (req, res) => {
    try {
        const mId = req.muzeuId;

        const eventsResult = await db.select({ count: sql`COUNT(*)` })
            .from(evenimente)
            .where(eq(evenimente.codUnicLocatie, mId)).get();

        const revResult = await db.select({ count: sql`COUNT(*)` })
            .from(recenzii)
            .where(eq(recenzii.codUnicLocatie, mId)).get();

        // Rezervările la evenimentele acestui muzeu (necesită JOIN la evenimente)
        const rezervari = await db.select({ count: sql`COUNT(*)` })
            .from(rezervariEvenimente)
            .leftJoin(evenimente, eq(rezervariEvenimente.eventId, evenimente.id))
            .where(eq(evenimente.codUnicLocatie, mId)).get();

        // Comenzile cu bilete de muzeu (fără eveniment asociat)
        const museumTicketsRows = await db.select({
                orderId: comenzi.numarComanda,
                total: comenzi.totalPlata
            })
            .from(comenzi)
            .leftJoin(bileteCumparate, eq(comenzi.numarComanda, bileteCumparate.numarComanda))
            .leftJoin(tipuriBilete, eq(bileteCumparate.codUnicTipBilet, tipuriBilete.codUnicTipBilet))
            .where(and(
                eq(tipuriBilete.codUnicLocatie, mId),
                eq(comenzi.statusPlata, 'Plătit'),
                sql`${tipuriBilete.codUnicEveniment} IS NULL`
            ))
            .groupBy(comenzi.numarComanda)
            .all();

        // Comenzile cu bilete de eveniment (au eveniment asociat)
        const eventTicketsRows = await db.select({
                orderId: comenzi.numarComanda,
                total: comenzi.totalPlata
            })
            .from(comenzi)
            .leftJoin(bileteCumparate, eq(comenzi.numarComanda, bileteCumparate.numarComanda))
            .leftJoin(tipuriBilete, eq(bileteCumparate.codUnicTipBilet, tipuriBilete.codUnicTipBilet))
            .where(and(
                eq(tipuriBilete.codUnicLocatie, mId),
                eq(comenzi.statusPlata, 'Plătit'),
                sql`${tipuriBilete.codUnicEveniment} IS NOT NULL`
            ))
            .groupBy(comenzi.numarComanda)
            .all();

        // Unificăm ID-urile comenzilor pentru a număra distinct comenzile totale
        const allOrderIds = new Set([
            ...museumTicketsRows.map(o => o.orderId),
            ...eventTicketsRows.map(o => o.orderId),
        ]);
        const ordersCount = allOrderIds.size;
        const revenueMuseum = museumTicketsRows.reduce((sum, o) => sum + o.total, 0);
        const revenueEvents = eventTicketsRows.reduce((sum, o) => sum + o.total, 0);

        // Total bilete individuale vândute (suma cantităților din comenzile plătite)
        const ticketsSoldResult = await db.select({
                total: sql`COALESCE(SUM(${bileteCumparate.cantitate}), 0)`
            })
            .from(bileteCumparate)
            .innerJoin(tipuriBilete, eq(bileteCumparate.codUnicTipBilet, tipuriBilete.codUnicTipBilet))
            .innerJoin(comenzi, and(
                eq(bileteCumparate.numarComanda, comenzi.numarComanda),
                eq(comenzi.statusPlata, 'Plătit')
            ))
            .where(eq(tipuriBilete.codUnicLocatie, mId))
            .get();
        const ticketsSold = ticketsSoldResult?.total || 0;

        // Ultimele 5 comenzi la această locație pentru feed-ul de activitate recentă
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
                ticketsSold,
                revenueMuseum,
                revenueEvents,
                recentOrders
            }
        });
    } catch (error) {
        console.error('Error fetching scoped dashboard stats:', error);
        res.status(500).json({ success: false, error: 'Eroare la preluarea serverului local.' });
    }
});

// Returnează profilul complet al muzeului administrat + tipurile de bilete de intrare
router.get('/my-museum', async (req, res) => {
    try {
        const mId = req.muzeuId;

        const muzeu = await db.select().from(locatiiPublice).where(eq(locatiiPublice.codUnicLocatie, mId)).get();
        if (!muzeu) return res.status(404).json({ success: false, error: 'Locația nu a fost găsită.' });

        // Biletele de intrare la muzeu (excluzând biletele de eveniment care au codUnicEveniment setat)
        const bilete = await db.select().from(tipuriBilete)
            .where(and(eq(tipuriBilete.codUnicLocatie, mId), sql`${tipuriBilete.codUnicEveniment} IS NULL`))
            .all();

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

// Actualizarea informațiilor editabile ale muzeului: orar, descriere, site, adresă
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

// Adăugare tip de bilet nou pentru muzeul curent — validare cu Zod prin middleware validateBody
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

// Editare tip de bilet — verificăm că biletul aparține muzeului curent înainte de update
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

// Ștergere tip de bilet — verificăm că aparține muzeului curent înainte de delete
router.delete('/tickets/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
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
// EVENIMENTE — CRUD STRICT PENTRU MUZEU
// ==========================================

// Returnează evenimentele muzeului, cu biletele aferente atașate relațional
router.get('/events', async (req, res) => {
    try {
        const eventsList = await db.select()
            .from(evenimente)
            .where(eq(evenimente.codUnicLocatie, req.muzeuId))
            .orderBy(desc(evenimente.dataStart))
            .all();

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

// Creare eveniment și tipurile de bilete asociate (dacă nu e gratuit)
// După creare, notificăm asincron utilizatorii care au muzeul la favorite
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

        // Dacă evenimentul are bilete cu plată, le inserăm în tipuri_bilete legate de eveniment
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

        // Trimitem email utilizatorilor care au acest muzeu la favorite (fire-and-forget)
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

// Editare eveniment — verificăm ownership-ul înainte de update
// Biletele se actualizează prin delete + re-insert (strategie simplă)
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

        // Ștergem biletele vechi și re-inserăm cele noi
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

// Ștergere eveniment — ștergem biletele asociate înainte pentru a evita erori FK
router.delete('/events/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const ev = await db.select().from(evenimente).where(eq(evenimente.id, id)).get();
        if (!ev || ev.codUnicLocatie !== req.muzeuId) {
            return res.status(403).json({ success: false, error: 'Inexistent sau acces interzis.' });
        }
        await db.delete(tipuriBilete).where(eq(tipuriBilete.codUnicEveniment, id)).run();
        await db.delete(evenimente).where(eq(evenimente.id, id)).run();
        res.json({ success: true, message: 'Eveniment șters complet.' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ success: false, error: 'Eroare la ștergerea evenimentului.' });
    }
});

// ==========================================
// COMENZI — READ-ONLY pentru muzeul curent
// ==========================================

// Returnează comenzile care conțin bilete la această locație (pentru monitorizare vânzări)
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
// REZERVĂRI — READ-ONLY pentru muzeul curent
// ==========================================

// Returnează rezervările la evenimentele acestui muzeu cu datele de contact ale utilizatorilor
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
// RECENZII — READ-ONLY pentru muzeul curent
// ==========================================

// Returnează recenziile primite de această locație cu datele utilizatorilor recenzori
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
