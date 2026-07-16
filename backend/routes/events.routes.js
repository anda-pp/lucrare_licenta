import express from 'express';
import {
    getAllEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent
} from '../controllers/events.controller.js';
import { requireAuth, requireSuperadmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Listarea și detaliile evenimentelor sunt publice
router.get('/', getAllEvents);
router.get('/:id', getEventById);

// Operațiile de scriere (creare, editare, ștergere) sunt rezervate superadminilor
// Evenimentele proprii de muzeu se gestionează prin museum-admin.routes.js
router.post('/', requireAuth, requireSuperadmin, createEvent);
router.put('/:id', requireAuth, requireSuperadmin, updateEvent);
router.delete('/:id', requireAuth, requireSuperadmin, deleteEvent);

export default router;
