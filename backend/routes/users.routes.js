import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';
import { db } from '../db/db.js';
import { comenzi, recenzii, carduriClienti, cardFidelitate, locatiiPublice, favoriteLocatii, intereseEvenimente, evenimente, bileteCumparate, tipuriBilete, facturi, rezervariEvenimente, user } from '../db/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

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
 * POST /api/users/checkout
 * Process ticket purchase and create order
 */
router.post('/checkout', requireAuth, async (req, res) => {
    try {
        const { locationId, tickets, total } = req.body;

        if (!locationId || !tickets || tickets.length === 0 || total === undefined) {
            return res.status(400).json({ success: false, error: 'Date invalide' });
        }

        // 1. Create Order
        const [newOrder] = await db.insert(comenzi).values({
            codUnicUtilizator: req.user.id,
            totalPlata: total,
            statusPlata: 'Plătit',
            statusComanda: 'Activă'
        }).returning({ id: comenzi.numarComanda });

        // 2. Insert Tickets
        const ticketInserts = [];
        for (const t of tickets) {
            if (t.cantitate > 0) {
                ticketInserts.push({
                    nrBiletCumparat: uuidv4(),
                    codUnicTipBilet: t.codUnicTipBilet,
                    numarComanda: newOrder.id,
                    cantitate: t.cantitate
                });
            }
        }

        if (ticketInserts.length > 0) {
            await db.insert(bileteCumparate).values(ticketInserts);
        }

        // 3. Create Invoice
        const serie = 'FCT-' + Math.floor(Math.random() * 10000);
        await db.insert(facturi).values({
            numarComanda: newOrder.id,
            serieFactura: serie,
            dataFacturare: new Date().toISOString().split('T')[0],
            tva: 0.19,
            totalFactura: total
        });

        res.json({ success: true, message: 'Comandă plasată cu succes!', orderId: newOrder.id });
    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({ success: false, error: 'Eroare la procesarea comenzii' });
    }
});

/**
 * GET /api/users/my-orders/:id/ticket
 * Download tickets for a specific order as PDF
 */
router.get('/my-orders/:id/ticket', requireAuth, async (req, res) => {
    try {
        const orderId = parseInt(req.params.id, 10);
        if (isNaN(orderId)) return res.status(400).send('ID comandă invalid');

        // Check if order belongs to user and is paid
        const orderInfo = await db.select().from(comenzi)
            .where(and(eq(comenzi.numarComanda, orderId), eq(comenzi.codUnicUtilizator, req.user.id)))
            .limit(1);

        if (orderInfo.length === 0) {
            return res.status(404).send('Comanda nu a fost găsită sau nu îți aparține');
        }

        const order = orderInfo[0];
        if (order.statusPlata !== 'Plătit' || order.statusComanda !== 'Activă') {
            return res.status(400).send('Nu se pot emite bilete pentru o comandă neplătită sau anulată');
        }

        // Fetch ticket details
        const tickets = await db.select({
            cantitate: bileteCumparate.cantitate,
            tipBilet: tipuriBilete.tipBilet,
            pret: tipuriBilete.pret,
            numeLocatie: locatiiPublice.numeLoc,
            orasLocatie: locatiiPublice.orasLoc
        })
            .from(bileteCumparate)
            .leftJoin(tipuriBilete, eq(bileteCumparate.codUnicTipBilet, tipuriBilete.codUnicTipBilet))
            .leftJoin(locatiiPublice, eq(tipuriBilete.codUnicLocatie, locatiiPublice.codUnicLocatie))
            .where(eq(bileteCumparate.numarComanda, orderId));

        if (tickets.length === 0) {
            return res.status(404).send('Nu au fost găsite bilete pentru această comandă');
        }

        // Create PDF with better defaults
        const doc = new PDFDocument({
            margin: 50,
            size: 'A4',
            info: {
                Title: `Bilete Comanda #${orderId}`,
                Author: 'Museum App'
            }
        });

        // Set response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Bilete_Comanda_${orderId}.pdf`);

        doc.pipe(res); // Stream directly to HTTP response

        const userName = req.user.numeComplet || 'Vizitator';

        // Helper function to remove diacritics
        const normalizeText = (text) => {
            if (!text) return '';
            return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ă/g, 'a').replace(/â/g, 'a').replace(/î/g, 'i').replace(/ș/g, 's').replace(/ț/g, 't').replace(/Ă/g, 'A').replace(/Â/g, 'A').replace(/Î/g, 'I').replace(/Ș/g, 'S').replace(/Ț/g, 'T');
        };

        // Draw Ticket Content
        for (let i = 0; i < tickets.length; i++) {
            const t = tickets[i];

            if (i > 0) doc.addPage();

            // Background / Border
            doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
                .lineWidth(2)
                .stroke('#1e293b');

            // Header Section Background
            doc.rect(30, 30, doc.page.width - 60, 100)
                .fill('#0f172a');

            // Header Text
            doc.font('Helvetica-Bold')
                .fontSize(28)
                .fillColor('#ffffff')
                .text('BILET DE ACCES', 0, 50, { align: 'center' });

            doc.font('Helvetica')
                .fontSize(14)
                .fillColor('#94a3b8')
                .text(normalizeText(t.numeLocatie || 'Locatie Nespecificata'), 0, 85, { align: 'center', width: doc.page.width });

            // Main Content Area
            doc.moveDown(4);

            const leftX = 70;
            const rightX = doc.page.width - 220;

            // Order Info (Left side)
            doc.font('Helvetica-Bold').fontSize(18).fillColor('#0f172a').text('Detalii Comanda', leftX, 170);

            doc.font('Helvetica-Bold').fontSize(12).fillColor('#64748b').text('Nume:', leftX, 205);
            doc.font('Helvetica').fillColor('#1e293b').text(normalizeText(userName), leftX + 80, 205);

            doc.font('Helvetica-Bold').fillColor('#64748b').text('Numar:', leftX, 225);
            doc.font('Helvetica').fillColor('#1e293b').text(`#${orderId}`, leftX + 80, 225);

            doc.font('Helvetica-Bold').fillColor('#64748b').text('Data:', leftX, 245);
            doc.font('Helvetica').fillColor('#1e293b').text(new Date(order.dataComanda).toLocaleDateString('ro-RO'), leftX + 80, 245);

            // Ticket Info (Left side, lower)
            doc.font('Helvetica-Bold').fontSize(18).fillColor('#0f172a').text('Detalii Bilet', leftX, 300);

            doc.font('Helvetica-Bold').fontSize(12).fillColor('#64748b').text('Tip Bilet:', leftX, 335);
            doc.font('Helvetica').fillColor('#1e293b').text(normalizeText(t.tipBilet), leftX + 80, 335);

            doc.font('Helvetica-Bold').fillColor('#64748b').text('Persoane:', leftX, 355);
            doc.font('Helvetica').fillColor('#1e293b').text(`${t.cantitate}`, leftX + 80, 355);

            doc.font('Helvetica-Bold').fillColor('#64748b').text('Pret total:', leftX, 375);
            doc.font('Helvetica-Bold').fillColor('#10b981').text(`${(t.pret * t.cantitate).toFixed(2)} RON`, leftX + 80, 375);

            // Generate QR Code
            const qrData = JSON.stringify({ order: orderId, user: req.user.id, type: normalizeText(t.tipBilet), loc: t.codUnicLocatie });
            const qrImage = await QRCode.toDataURL(qrData, { margin: 1, width: 150, color: { dark: '#0f172a', light: '#ffffff' } });

            // Draw QR Code Background & Image (Right side)
            doc.rect(rightX - 10, 160, 170, 190).fill('#f1f5f9');
            doc.image(qrImage, rightX, 170, { width: 150 });
            doc.font('Courier-Bold').fontSize(10).fillColor('#475569').text('SCANATI LA INTRARE', rightX, 330, { width: 150, align: 'center' });

            // Cut Here Dashed Line
            doc.moveTo(30, 430).lineTo(doc.page.width - 30, 430).dash(5, { space: 5 }).stroke('#cbd5e1');
            doc.undash(); // Important to reset

            // Terms & Conditions (Footer area)
            doc.font('Helvetica-Bold').fontSize(10).fillColor('#64748b').text('Termeni si Conditii', 70, 460);
            doc.font('Helvetica').fontSize(8).fillColor('#94a3b8').text(
                '1. Acest bilet asigura unicul acces pentru numarul de persoane specificat.\n' +
                '2. Biletul este nominal si nu poate fi transferat altei persoane.\n' +
                '3. Va rugam sa pastrati biletul in conditii bune (pe telefon sau printat) pentru scanarea codului QR.\n' +
                '4. Orice incercare de frauda va atrage anularea biletului fara rambursare.',
                70, 480, { width: doc.page.width - 140, lineGap: 4 }
            );

            // Absolute Footer
            doc.font('Helvetica').fontSize(9).fillColor('#cbd5e1')
                .text('Aplicația de Licență - Sistem de Gestionare Muzee și Galerii © 2024', 0, doc.page.height - 60, { align: 'center', width: doc.page.width });
        }

        doc.end();

    } catch (error) {
        console.error('Ticket generation error:', error);
        if (!res.headersSent) {
            res.status(500).send('Eroare la generarea biletelor');
        }
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
 * PUT /api/users/my-reviews/:id
 * Edit an existing review
 */
router.put('/my-reviews/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, descriereRecenzie } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, error: 'Rating invalid' });
        }

        const rezultat = await db.update(recenzii)
            .set({ rating, descriereRecenzie })
            .where(and(eq(recenzii.numarRecenzie, id), eq(recenzii.codUnicUtilizator, req.user.id)));

        if (rezultat.changes === 0) {
            return res.status(404).json({ success: false, error: 'Recenzia nu a fost găsită sau nu îți aparține' });
        }

        res.json({ success: true, message: 'Recenzia a fost actualizată' });
    } catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({ success: false, error: 'Eroare la actualizarea recenziei' });
    }
});

/**
 * DELETE /api/users/my-reviews/:id
 * Delete a review
 */
router.delete('/my-reviews/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const rezultat = await db.delete(recenzii)
            .where(and(eq(recenzii.numarRecenzie, id), eq(recenzii.codUnicUtilizator, req.user.id)));

        if (rezultat.changes === 0) {
            return res.status(404).json({ success: false, error: 'Recenzia nu a fost găsită sau nu îți aparține' });
        }

        res.json({ success: true, message: 'Recenzia a fost ștearsă' });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({ success: false, error: 'Eroare la ștergerea recenziei' });
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

/**
 * POST /api/users/events/:id/reserve
 * Create a free event reservation
 */
router.post('/events/:id/reserve', requireAuth, async (req, res) => {
    try {
        const { id: eventId } = req.params;
        const { nrPersoane, ziuaAleasa, intervalOrar } = req.body;

        // Verify event exists and is free
        const [event] = await db.select().from(evenimente).where(eq(evenimente.id, eventId)).limit(1);
        if (!event) return res.status(404).json({ success: false, error: 'Evenimentul nu a fost găsit' });
        if (!event.isGratuit) return res.status(400).json({ success: false, error: 'Evenimentul nu este gratuit' });

        const reservationId = uuidv4();
        const numeRezervant = req.user.numeComplet || req.user.name || 'Vizitator';

        await db.insert(rezervariEvenimente).values({
            id: reservationId,
            eventId,
            userId: req.user.id,
            numeRezervant,
            nrPersoane: parseInt(nrPersoane) || 1,
            ziuaAleasa: ziuaAleasa || null,
            intervalOrar: intervalOrar || null,
        });

        res.json({ success: true, reservationId });
    } catch (error) {
        console.error('Reserve event error:', error);
        res.status(500).json({ success: false, error: 'Eroare la creare rezervare' });
    }
});

/**
 * GET /api/users/my-reservations
 * List all reservations for the current user
 */
router.get('/my-reservations', requireAuth, async (req, res) => {
    try {
        const reservations = await db
            .select({
                id: rezervariEvenimente.id,
                numeRezervant: rezervariEvenimente.numeRezervant,
                nrPersoane: rezervariEvenimente.nrPersoane,
                ziuaAleasa: rezervariEvenimente.ziuaAleasa,
                intervalOrar: rezervariEvenimente.intervalOrar,
                dataRezervare: rezervariEvenimente.dataRezervare,
                titluEveniment: evenimente.titlu,
                tipEveniment: evenimente.tipEveniment,
                dataStart: evenimente.dataStart,
                numeLocatie: locatiiPublice.numeLoc,
                orasLocatie: locatiiPublice.orasLoc,
            })
            .from(rezervariEvenimente)
            .leftJoin(evenimente, eq(rezervariEvenimente.eventId, evenimente.id))
            .leftJoin(locatiiPublice, eq(evenimente.codUnicLocatie, locatiiPublice.codUnicLocatie))
            .where(eq(rezervariEvenimente.userId, req.user.id))
            .orderBy(desc(rezervariEvenimente.dataRezervare));

        res.json({ success: true, data: reservations });
    } catch (error) {
        console.error('My reservations error:', error);
        res.status(500).json({ success: false, error: 'Eroare la preluarea rezervărilor' });
    }
});

/**
 * GET /api/users/my-reservations/:id/ticket
 * Generate PDF ticket for a reservation
 */
router.get('/my-reservations/:id/ticket', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const [reservation] = await db
            .select({
                id: rezervariEvenimente.id,
                numeRezervant: rezervariEvenimente.numeRezervant,
                nrPersoane: rezervariEvenimente.nrPersoane,
                ziuaAleasa: rezervariEvenimente.ziuaAleasa,
                intervalOrar: rezervariEvenimente.intervalOrar,
                dataRezervare: rezervariEvenimente.dataRezervare,
                titluEveniment: evenimente.titlu,
                tipEveniment: evenimente.tipEveniment,
                dataStart: evenimente.dataStart,
                numeLocatie: locatiiPublice.numeLoc,
                orasLocatie: locatiiPublice.orasLoc,
                adresaLocatie: locatiiPublice.adresa,
                userId: rezervariEvenimente.userId,
            })
            .from(rezervariEvenimente)
            .leftJoin(evenimente, eq(rezervariEvenimente.eventId, evenimente.id))
            .leftJoin(locatiiPublice, eq(evenimente.codUnicLocatie, locatiiPublice.codUnicLocatie))
            .where(and(eq(rezervariEvenimente.id, id), eq(rezervariEvenimente.userId, req.user.id)))
            .limit(1);

        if (!reservation) return res.status(404).send('Rezervarea nu a fost găsită');

        const normalizeText = (text) => {
            if (!text) return '';
            return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ă/g, 'a').replace(/â/g, 'a').replace(/î/g, 'i').replace(/ș/g, 's').replace(/ț/g, 't').replace(/Ă/g, 'A').replace(/Â/g, 'A').replace(/Î/g, 'I').replace(/Ș/g, 'S').replace(/Ț/g, 'T');
        };

        const doc = new PDFDocument({ margin: 50, size: 'A4', info: { Title: `Bilet Rezervare ${id}`, Author: 'Museum App' } });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Bilet_Rezervare_${id.slice(0, 8)}.pdf`);
        doc.pipe(res);

        // Background border
        doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).lineWidth(2).stroke('#1e293b');

        // Dark header
        doc.rect(30, 30, doc.page.width - 60, 100).fill('#0f172a');

        doc.font('Helvetica-Bold').fontSize(22).fillColor('#ffffff')
            .text('BILET DE PARTICIPARE GRATUITA', 0, 50, { align: 'center' });
        doc.font('Helvetica').fontSize(13).fillColor('#94a3b8')
            .text(normalizeText(reservation.titluEveniment || 'Eveniment'), 0, 82, { align: 'center', width: doc.page.width });

        const leftX = 70;

        // Event Details
        doc.font('Helvetica-Bold').fontSize(16).fillColor('#0f172a').text('Detalii Eveniment', leftX, 165);

        const fields = [
            ['Participant:', reservation.numeRezervant],
            ['Locatie:', normalizeText(reservation.numeLocatie || '-')],
            ['Oras:', normalizeText(reservation.orasLocatie || '-')],
            ['Zi aleasa:', reservation.ziuaAleasa ? new Date(reservation.ziuaAleasa).toLocaleDateString('ro-RO') : '-'],
            ['Interval:', reservation.intervalOrar || '-'],
            ['Nr. Persoane:', String(reservation.nrPersoane)],
            ['Pret:', 'GRATUIT'],
        ];

        let yPos = 200;
        for (const [label, value] of fields) {
            doc.font('Helvetica-Bold').fontSize(11).fillColor('#64748b').text(label, leftX, yPos);
            const isPrice = label === 'Pret:';
            doc.font('Helvetica').fillColor(isPrice ? '#10b981' : '#1e293b').text(value, leftX + 120, yPos);
            yPos += 22;
        }

        // QR Code (right side)
        const qrData = JSON.stringify({ id: reservation.id, user: reservation.userId, np: reservation.nrPersoane, ev: reservation.titluEveniment });
        const qrImage = await QRCode.toDataURL(qrData, { margin: 1, width: 150, color: { dark: '#0f172a', light: '#ffffff' } });
        const qrBuffer = Buffer.from(qrImage.split(',')[1], 'base64');
        doc.image(qrBuffer, doc.page.width - 230, 160, { width: 150, height: 150 });

        // Footer
        doc.font('Helvetica').fontSize(10).fillColor('#94a3b8')
            .text(`Rezervare ID: ${reservation.id}`, leftX, doc.page.height - 100, { align: 'left' });
        doc.text(`Emis: ${new Date().toLocaleDateString('ro-RO')}`, leftX, doc.page.height - 85);

        doc.end();
    } catch (error) {
        console.error('Reservation ticket error:', error);
        res.status(500).send('Eroare la generarea biletului');
    }
});

export default router;
