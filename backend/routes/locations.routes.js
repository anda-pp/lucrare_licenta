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
import { getLocationImages } from '../controllers/upload.controller.js';
import { requireAuth, requireSuperadmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Locațiile pot fi văzute de oricine, fără autentificare
router.get('/', getAllLocations);
router.get('/:id', getLocationById);

// Galeria publică de imagini a unei locații — accesibilă fără autentificare
router.get('/:id/images', (req, res, next) => {
    req.params.locationId = req.params.id;
    next();
}, getLocationImages);

// Crearea și editarea locațiilor — doar superadmin
router.post('/', requireSuperadmin, createLocation);
router.put('/:id', requireSuperadmin, updateLocation);
router.delete('/:id', requireSuperadmin, deleteLocation);

// Gestionarea tipurilor de bilete ale unei locații — doar superadmin
// Museum-admin-ul gestionează biletele proprii prin ruta /museum-admin/tickets
router.get('/:id/tickets', getTicketsByLocation);
router.post('/:id/tickets', requireSuperadmin, createTicket);
router.put('/tickets/:ticketId', requireSuperadmin, updateTicket);
router.delete('/tickets/:ticketId', requireSuperadmin, deleteTicket);

export default router;
