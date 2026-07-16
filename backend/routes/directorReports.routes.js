import express from 'express';
import { getLoyaltyReport, getLocationPerformance } from '../controllers/directorReports.controller.js';
import { requireAuth, requireStaff } from '../middleware/authMiddleware.js';

const router = express.Router();

// Rapoartele de director sunt accesibile personalului, adminilor și superadminilor
router.use(requireAuth);
router.use(requireStaff);

// Raport eficiența programului de fidelitate
router.get('/loyalty', getLoyaltyReport);

// Raport performanță locație — venituri, comenzi, rezervări
router.get('/location-performance', getLocationPerformance);

export default router;
