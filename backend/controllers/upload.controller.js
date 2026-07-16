import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { db } from '../db/db.js';
import { imaginiLocatii, locatiiPublice } from '../db/schema.js';
import { eq, asc } from 'drizzle-orm';

// Creăm directorul de upload dacă nu există
const uploadDir = './uploads/locations';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurăm Multer să salveze fișierele pe disk cu nume unic UUID
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = crypto.randomUUID();
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    },
});

// Acceptăm doar imagini — validăm atât MIME type cât și extensia fișierului
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeOk = ALLOWED_MIME_TYPES.includes(file.mimetype);
    const extOk = ALLOWED_EXTENSIONS.includes(ext);
    if (mimeOk && extOk) {
        cb(null, true);
    } else {
        cb(new Error('Tip de fișier invalid. Sunt permise doar imagini (JPEG, PNG, GIF, WebP).'), false);
    }
};

// Instanța Multer exportată — maxim 5MB per fișier, maxim 10 fișiere per request
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 10,
    },
});

// Upload imagini pentru o locație — le salvăm pe disk și înregistrăm în DB cu ordinea de afișare
// Dacă locația nu are deja un cover (imagineUrl = null), prima imagine uploadată devine automat cover
export const uploadLocationImages = async (req, res) => {
    try {
        const { locationId } = req.params;
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Nu a fost încărcat niciun fișier',
            });
        }

        // Determinăm ordinea de start a noilor imagini (continuăm după ultimul index existent)
        const existingImages = await db
            .select()
            .from(imaginiLocatii)
            .where(eq(imaginiLocatii.codUnicLocatie, locationId));

        let maxOrder = existingImages.length > 0
            ? Math.max(...existingImages.map(img => img.ordinAfisare || 0))
            : 0;

        const savedImages = [];
        for (const file of files) {
            maxOrder++;
            const imageData = {
                codUnicImagine: crypto.randomUUID(),
                codUnicLocatie: locationId,
                numeOriginal: file.originalname,
                caleFisier: `/uploads/locations/${file.filename}`,
                tipFisier: file.mimetype,
                marimeFisier: file.size,
                dataIncarcare: new Date().toISOString(),
                ordinAfisare: maxOrder,
            };

            await db.insert(imaginiLocatii).values(imageData);
            savedImages.push(imageData);
        }

        // La orice upload, prima imagine din batch devine automat cover-ul locației (imagineUrl)
        if (savedImages.length > 0) {
            await db
                .update(locatiiPublice)
                .set({ imagineUrl: savedImages[0].caleFisier })
                .where(eq(locatiiPublice.codUnicLocatie, locationId));
            console.log(`🖼️  Cover actualizat automat pentru locația ${locationId}: ${savedImages[0].caleFisier}`);
        }

        console.log(`✅ Uploaded ${files.length} images for location ${locationId}`);

        res.json({
            success: true,
            message: `${files.length} imagine(i) încărcate cu succes`,
            images: savedImages,
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            error: 'Eroare la încărcarea imaginilor',
        });
    }
};

// Returnează toate imaginile unei locații, sortate după ordinea de afișare
export const getLocationImages = async (req, res) => {
    try {
        const { locationId } = req.params;

        const images = await db
            .select()
            .from(imaginiLocatii)
            .where(eq(imaginiLocatii.codUnicLocatie, locationId))
            .orderBy(imaginiLocatii.ordinAfisare);

        res.json({
            success: true,
            images,
        });
    } catch (error) {
        console.error('Get images error:', error);
        res.status(500).json({
            success: false,
            error: 'Eroare la obținerea imaginilor',
        });
    }
};

// Ștergere imagine — eliminăm fișierul de pe disk și înregistrarea din DB
// Dacă imaginea ștearsă era cover-ul locației (imagineUrl), actualizăm cover-ul cu următoarea imagine
export const deleteImage = async (req, res) => {
    try {
        const { imageId } = req.params;

        const images = await db
            .select()
            .from(imaginiLocatii)
            .where(eq(imaginiLocatii.codUnicImagine, imageId));

        if (images.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Imaginea nu a fost găsită',
            });
        }

        const image = images[0];
        const locationId = image.codUnicLocatie;

        // Ștergem fișierul fizic de pe disk dacă există
        const filePath = `.${image.caleFisier}`;
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await db
            .delete(imaginiLocatii)
            .where(eq(imaginiLocatii.codUnicImagine, imageId));

        // Verificăm dacă imaginea ștearsă era cover-ul locației
        const location = await db
            .select({ imagineUrl: locatiiPublice.imagineUrl })
            .from(locatiiPublice)
            .where(eq(locatiiPublice.codUnicLocatie, locationId))
            .limit(1);

        if (location.length > 0 && location[0].imagineUrl === image.caleFisier) {
            // Căutăm prima imagine rămasă în galerie (cu cel mai mic ordinAfisare)
            const remaining = await db
                .select({ caleFisier: imaginiLocatii.caleFisier })
                .from(imaginiLocatii)
                .where(eq(imaginiLocatii.codUnicLocatie, locationId))
                .orderBy(asc(imaginiLocatii.ordinAfisare))
                .limit(1);

            const newCover = remaining.length > 0 ? remaining[0].caleFisier : null;
            await db
                .update(locatiiPublice)
                .set({ imagineUrl: newCover })
                .where(eq(locatiiPublice.codUnicLocatie, locationId));
            console.log(`🖼️  Cover actualizat pentru locația ${locationId}: ${newCover || 'null'}`);
        }

        console.log(`🗑️ Deleted image ${imageId}`);

        res.json({
            success: true,
            message: 'Imagine ștearsă cu succes',
        });
    } catch (error) {
        console.error('Delete image error:', error);
        res.status(500).json({
            success: false,
            error: 'Eroare la ștergerea imaginii',
        });
    }
};

// Setează manual o imagine ca cover principal al locației (actualizează imagineUrl în locatiiPublice)
export const setCoverImage = async (req, res) => {
    try {
        const { imageId } = req.params;

        const images = await db
            .select()
            .from(imaginiLocatii)
            .where(eq(imaginiLocatii.codUnicImagine, imageId));

        if (images.length === 0) {
            return res.status(404).json({ success: false, error: 'Imaginea nu a fost găsită' });
        }

        const image = images[0];

        await db
            .update(locatiiPublice)
            .set({ imagineUrl: image.caleFisier })
            .where(eq(locatiiPublice.codUnicLocatie, image.codUnicLocatie));

        console.log(`🖼️  Cover setat manual pentru locația ${image.codUnicLocatie}: ${image.caleFisier}`);

        res.json({ success: true, message: 'Cover setat cu succes' });
    } catch (error) {
        console.error('Set cover error:', error);
        res.status(500).json({ success: false, error: 'Eroare la setarea cover-ului' });
    }
};
