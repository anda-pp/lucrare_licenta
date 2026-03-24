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
import { requireAuth, requireSuperadmin } from '../middleware/authMiddleware.js';

const router = express.Router();
// Public routes
router.get('/', getAllLocations);
router.get('/:id', getLocationById);

// Protected routes - Admin  can create/update
router.post('/', requireSuperadmin, createLocation);
router.put('/:id', requireSuperadmin, updateLocation);

// Admin only - delete
router.delete('/:id', requireSuperadmin, deleteLocation);

// Ticket management
router.get('/:id/tickets', getTicketsByLocation);
router.post('/:id/tickets', requireSuperadmin, createTicket);
router.put('/tickets/:ticketId', requireSuperadmin, updateTicket);
router.delete('/tickets/:ticketId', requireSuperadmin, deleteTicket);

export default router;
