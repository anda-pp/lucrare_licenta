import express from 'express';
import {
    getAllEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent
} from '../controllers/events.controller.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllEvents);
router.get('/:id', getEventById);

// Protected routes (Admin only for now, could be Staff too based on business rules)
router.post('/', requireAuth, requireAdmin, createEvent);
router.put('/:id', requireAuth, requireAdmin, updateEvent);
router.delete('/:id', requireAuth, requireAdmin, deleteEvent);

export default router;
