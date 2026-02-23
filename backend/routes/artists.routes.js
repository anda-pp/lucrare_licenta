import express from 'express';
import {
    getAllArtists,
    getArtistById,
    createArtist,
    updateArtist,
    deleteArtist
} from '../controllers/artists.controller.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllArtists);
router.get('/:id', getArtistById);

// Protected routes (Admin only for now)
router.post('/', requireAuth, requireAdmin, createArtist);
router.put('/:id', requireAuth, requireAdmin, updateArtist);
router.delete('/:id', requireAuth, requireAdmin, deleteArtist);

export default router;
