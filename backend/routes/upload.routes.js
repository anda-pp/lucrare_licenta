import express from 'express';
import { upload, uploadLocationImages, getLocationImages, deleteImage, setCoverImage } from '../controllers/upload.controller.js';
import { requireAuth, requireSuperadmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Upload-ul de imagini necesită autentificare și rol de superadmin
router.use(requireAuth);
router.use(requireSuperadmin);

// Upload multiple imagini pentru o locație (maxim 10 fișiere per request)
router.post('/location/:locationId', upload.array('images', 10), uploadLocationImages);

// Listarea imaginilor unei locații — orice admin autentificat
router.get('/location/:locationId', getLocationImages);

// Setează o imagine ca cover principal al locației (actualizează imagineUrl din locatiiPublice)
router.put('/image/:imageId/cover', setCoverImage);

// Ștergerea unei imagini specifice din galeria locației
router.delete('/image/:imageId', deleteImage);

export default router;
