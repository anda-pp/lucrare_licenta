import express from 'express';
import {
    getAllLocations,
    getLocationById,
    createLocation,
    updateLocation,
    deleteLocation,
    getTicketsByLocation,
    createTicket,
    updateTicket,
    deleteTicket,
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

// Ticket management
router.get('/:id/tickets', getTicketsByLocation);
router.post('/:id/tickets', requireAdmin, createTicket);
router.put('/tickets/:ticketId', requireAdmin, updateTicket);
router.delete('/tickets/:ticketId', requireAdmin, deleteTicket);

export default router;
