import express from 'express';
import { getReports } from '../controllers/reports.controller.js';
import { requireAuth, requireStaff } from '../middleware/authMiddleware.js';

const router = express.Router();

// Rapoartele generale sunt accesibile personalului, adminilor și superadminilor
router.use(requireAuth);
router.use(requireStaff);

router.get('/', getReports);

export default router;
