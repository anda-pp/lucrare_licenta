import express from 'express';
import { db } from '../db/db.js';
import { trasee, traseeLocatii, locatiiPublice } from '../db/schema.js';
import { sql, eq, and, asc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth, requireSuperadmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Returnează toate traseele din baza de date, ordonate după data creării,
// împreună cu locațiile aferente fiecărui traseu (join pe traseeLocatii + locatiiPublice)
router.get('/', async (req, res) => {
    try {
        const toateTraseele = db.select().from(trasee).orderBy(asc(trasee.dataCreare)).all();

        // Preluăm toate legăturile traseu-locație, sortate după ordinea din traseu
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

        // Grupăm locațiile pe traseuId ca să le putem atașa rapid fiecărui traseu
        const locatiiPeTraseu = {};
        legaturi.forEach(legatura => {
            if (!locatiiPeTraseu[legatura.traseuId]) locatiiPeTraseu[legatura.traseuId] = [];
            locatiiPeTraseu[legatura.traseuId].push({
                ...legatura.locatie,
                ordine: legatura.ordine
            });
        });

        // Construim răspunsul final: fiecare traseu cu lista lui de locații în ordine
        const result = toateTraseele.map(t => {
            return {
                id: t.id,
                titlu: t.titlu,
                descriere: t.descriere,
                durataEstimata: t.durataEstimata, // în minute
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

// Creare traseu nou — accesibil doar superadminilor
router.post('/admin', requireSuperadmin, async (req, res) => {
    try {
        const { titlu, descriere, durataEstimata, oras, imagineUrl, activ, locatiiValide } = req.body;

        // Generăm un ID unic pentru traseu cu prefix descriptiv
        const newTrailId = `trail_${uuidv4()}`;

        // Inserăm traseul principal în tabela trasee
        db.insert(trasee).values({
            id: newTrailId,
            titlu: titlu || 'Traseu Nou',
            descriere: descriere || '',
            durataEstimata: durataEstimata || 120,
            oras: oras || '',
            imagineUrl: imagineUrl || '',
            activ: activ !== undefined ? activ : true
        }).run();

        // Dacă s-au trimis locații, le inserăm în tabela de legătură cu ordinea păstrată
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

// Editare traseu existent — accesibil doar superadminilor
router.put('/admin/:id', requireSuperadmin, async (req, res) => {
    try {
        const trailId = req.params.id;
        const { titlu, descriere, durataEstimata, oras, imagineUrl, activ, locatiiValide } = req.body;

        // Actualizăm metadatele traseului
        db.update(trasee)
            .set({ titlu, descriere, durataEstimata, oras, imagineUrl, activ })
            .where(eq(trasee.id, trailId))
            .run();

        // Ștergem toate locațiile vechi și le reinserăm în ordinea nouă
        // e mai simplu decât un diff și garantează ordinea corectă
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

// Ștergere traseu — cascade în DB va șterge automat și legăturile din traseeLocatii
router.delete('/admin/:id', requireSuperadmin, async (req, res) => {
    try {
        const trailId = req.params.id;
        db.delete(trasee).where(eq(trasee.id, trailId)).run();
        res.json({ success: true, message: 'Traseu sters' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Eroare stergere traseu' });
    }
});

export default router;
