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

// Listarea și vizualizarea artiștilor sunt publice — orice vizitator le poate accesa
router.get('/', getAllArtists);
router.get('/:id', getArtistById);

// Crearea, editarea și ștergerea sunt rezervate superadminilor
router.post('/', requireAuth, requireSuperadmin, createArtist);
router.put('/:id', requireAuth, requireSuperadmin, updateArtist);
router.delete('/:id', requireAuth, requireSuperadmin, deleteArtist);

export default router;
