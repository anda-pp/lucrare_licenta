import express from 'express';
import { db } from '../db/db.js';
import { trasee, traseeLocatii, locatiiPublice } from '../db/schema.js';
import { sql, eq, and, asc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/trails — Obține toate traseele configurate, împreună cu locațiile aferente
router.get('/', async (req, res) => {
    try {
        // Obținem toate traseele active 
        // (Pentru admin le dăm pe toate, pentru useri doar cele active, dar simplificăm logica trimițându-le pe toate acum
        // iar pe frontend filtrăm dacă e nevoie, sau verificăm rolul).
        const toateTraseele = db.select().from(trasee).orderBy(asc(trasee.dataCreare)).all();

        // Obținem rândurile de legătură
        const legaturi = await db.select({
            traseuId: traseeLocatii.traseuId,
            ordine: traseeLocatii.ordine,
            locatie: {
                codUnicLocatie: locatiiPublice.codUnicLocatie,
                numeLoc: locatiiPublice.numeLoc,
                tipLocatie: locatiiPublice.tipLocatie,
                imagineUrl: locatiiPublice.imagineUrl,
                adresa: locatiiPublice.adresa,
                orar: locatiiPublice.orar
            }
        })
            .from(traseeLocatii)
            .innerJoin(locatiiPublice, eq(traseeLocatii.codUnicLocatie, locatiiPublice.codUnicLocatie))
            .orderBy(asc(traseeLocatii.ordine))
            .all();

        // Group locations by traseuId
        const locatiiPeTraseu = {};
        legaturi.forEach(legatura => {
            if (!locatiiPeTraseu[legatura.traseuId]) locatiiPeTraseu[legatura.traseuId] = [];
            locatiiPeTraseu[legatura.traseuId].push({
                ...legatura.locatie,
                ordine: legatura.ordine
            });
        });

        // Calculăm manual rating-ul agregat pe locații (similar cu vechea rută) 
        // Aici pentru performanță lăsăm doar datele statice, un sistem mai complex ar face un GROUP BY SQL
        const result = toateTraseele.map(t => {
            return {
                id: t.id,
                titlu: t.titlu,
                descriere: t.descriere,
                durataEstimata: t.durataEstimata, // Minute
                oras: t.oras,
                imagineUrl: t.imagineUrl,
                activ: t.activ,
                dataCreare: t.dataCreare,
                locatii: locatiiPeTraseu[t.id] || []
            };
        });

        res.json({ success: true, data: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Eroare server' });
    }
});

// Admin-only rutes: POST, PUT, DELETE
router.post('/admin', requireAdmin, async (req, res) => {
    try {
        const { titlu, descriere, durataEstimata, oras, imagineUrl, activ, locatiiValide } = req.body;

        const newTrailId = `trail_${uuidv4()}`;

        // 1. Inseram traseul root
        db.insert(trasee).values({
            id: newTrailId,
            titlu: titlu || 'Traseu Nou',
            descriere: descriere || '',
            durataEstimata: durataEstimata || 120,
            oras: oras || '',
            imagineUrl: imagineUrl || '',
            activ: activ !== undefined ? activ : true
        }).run();

        // 2. Inseram linkurile daca exista
        if (locatiiValide && Array.isArray(locatiiValide) && locatiiValide.length > 0) {
            const locatiiInsert = locatiiValide.map((cod, index) => ({
                id: uuidv4(),
                traseuId: newTrailId,
                codUnicLocatie: cod,
                ordine: index + 1
            }));
            db.insert(traseeLocatii).values(locatiiInsert).run();
        }

        res.json({ success: true, message: 'Traseu creat cu succes', id: newTrailId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Eroare creare traseu' });
    }
});

router.put('/admin/:id', requireAdmin, async (req, res) => {
    try {
        const trailId = req.params.id;
        const { titlu, descriere, durataEstimata, oras, imagineUrl, activ, locatiiValide } = req.body;

        // 1. Update metadata
        db.update(trasee)
            .set({ titlu, descriere, durataEstimata, oras, imagineUrl, activ })
            .where(eq(trasee.id, trailId))
            .run();

        // 2. Rescriere locatii (DROP si INSERT e mai sigur pt ordering la array-uri simple)
        db.delete(traseeLocatii).where(eq(traseeLocatii.traseuId, trailId)).run();

        if (locatiiValide && Array.isArray(locatiiValide) && locatiiValide.length > 0) {
            const locatiiInsert = locatiiValide.map((cod, index) => ({
                id: uuidv4(),
                traseuId: trailId,
                codUnicLocatie: cod,
                ordine: index + 1
            }));
            db.insert(traseeLocatii).values(locatiiInsert).run();
        }

        res.json({ success: true, message: 'Traseu actualizat' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Eroare editare traseu' });
    }
});

router.delete('/admin/:id', requireAdmin, async (req, res) => {
    try {
        const trailId = req.params.id;
        db.delete(trasee).where(eq(trasee.id, trailId)).run(); // cascade will delete links
        res.json({ success: true, message: 'Traseu sters' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Eroare stergere traseu' });
    }
});

export default router;
