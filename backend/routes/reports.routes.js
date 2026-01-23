import express from 'express';
import { getReports } from '../controllers/reports.controller.js';
import { requireAuth, requireStaff } from '../middleware/authMiddleware.js';

const router = express.Router();

// Reports require authentication and staff role
router.use(requireAuth);
router.use(requireStaff);

router.get('/', getReports);

export default router;
