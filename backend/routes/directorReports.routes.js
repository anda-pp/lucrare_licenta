import express from 'express';
import { getLoyaltyReport, getLocationPerformance } from '../controllers/directorReports.controller.js';
import { requireAuth, requireStaff } from '../middleware/authMiddleware.js';

const router = express.Router();

// All director reports require authentication and staff/admin role
router.use(requireAuth);
router.use(requireStaff);

// Loyalty Program Efficiency Report
router.get('/loyalty', getLoyaltyReport);

// Location Performance Report
router.get('/location-performance', getLocationPerformance);

export default router;

