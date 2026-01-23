import express from 'express';
import {
    getAllLocations,
    getLocationById,
    createLocation,
    updateLocation,
    deleteLocation,
} from '../controllers/locations.controller.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();
// Public routes
router.get('/', getAllLocations);
router.get('/:id', getLocationById);

// Protected routes - Admin  can create/update
router.post('/', requireAdmin, createLocation);
router.put('/:id', requireAdmin, updateLocation);

// Admin only - delete
router.delete('/:id', requireAdmin, deleteLocation);

export default router;
