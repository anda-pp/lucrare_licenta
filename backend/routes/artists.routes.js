import express from 'express';
import {
    getAllArtists,
    getArtistById,
    createArtist,
    updateArtist,
    deleteArtist
} from '../controllers/artists.controller.js';
import { requireAuth, requireSuperadmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllArtists);
router.get('/:id', getArtistById);

// Protected routes (Admin only for now)
router.post('/', requireAuth, requireSuperadmin, createArtist);
router.put('/:id', requireAuth, requireSuperadmin, updateArtist);
router.delete('/:id', requireAuth, requireSuperadmin, deleteArtist);

export default router;
