import express from 'express';
import { getStaffDashboard } from '../controllers/staff.controller.js';
import { requireAuth, requireStaff } from '../middleware/authMiddleware.js';

const router = express.Router();

// All staff routes require authentication and staff/admin role
router.use(requireAuth);
router.use(requireStaff);

// Dashboard statistics
router.get('/dashboard', getStaffDashboard);

export default router;
