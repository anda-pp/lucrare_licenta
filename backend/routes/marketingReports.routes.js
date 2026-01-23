import express from 'express';
import { getSentimentAnalysis, getRatingRevenueCorrelation } from '../controllers/marketingReports.controller.js';
import { requireAuth, requireStaff } from '../middleware/authMiddleware.js';

const router = express.Router();

// All marketing reports require authentication and staff/admin role
router.use(requireAuth);
router.use(requireStaff);

// Sentiment Analysis Report
router.get('/sentiment', getSentimentAnalysis);

// Rating-Revenue Correlation Report
router.get('/correlation', getRatingRevenueCorrelation);

export default router;

