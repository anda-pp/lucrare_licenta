import express from 'express';
import { upload, uploadLocationImages, getLocationImages, deleteImage } from '../controllers/upload.controller.js';
import { requireAuth, requireSuperadmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All upload routes require authentication
router.use(requireAuth);
router.use(requireSuperadmin);

// Upload images for a location (admin only)
router.post('/location/:locationId', upload.array('images', 10), uploadLocationImages);

// Get all images for a location (any authenticated user)
router.get('/location/:locationId', getLocationImages);

// Delete an image (admin only)
router.delete('/image/:imageId', deleteImage);

export default router;
