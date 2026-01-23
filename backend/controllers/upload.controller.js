import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { db } from '../db/db.js';
import { imaginiLocatii } from '../db/schema.js';
import { eq } from 'drizzle-orm';

// Create uploads directory if it doesn't exist
const uploadDir = './uploads/locations';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = crypto.randomUUID();
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    },
});

// File filter - only images
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tip de fișier invalid. Sunt permise doar imagini (JPEG, PNG, GIF, WebP).'), false);
    }
};

// Multer upload configuration
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
        files: 10, // Max 10 files at once
    },
});

/**
 * POST /api/uploads/location/:locationId
 * Upload one or more images for a location
 */
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

        // Get current max order for this location
        const existingImages = await db
            .select()
            .from(imaginiLocatii)
            .where(eq(imaginiLocatii.codUnicLocatie, locationId));

        let maxOrder = existingImages.length > 0
            ? Math.max(...existingImages.map(img => img.ordinAfisare || 0))
            : 0;

        // Save each file info to database
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

/**
 * GET /api/uploads/location/:locationId
 * Get all images for a location
 */
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

/**
 * DELETE /api/uploads/image/:imageId
 * Delete a specific image
 */
export const deleteImage = async (req, res) => {
    try {
        const { imageId } = req.params;

        // Get image info
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

        // Delete file from disk
        const filePath = `.${image.caleFisier}`;
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete from database
        await db
            .delete(imaginiLocatii)
            .where(eq(imaginiLocatii.codUnicImagine, imageId));

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
