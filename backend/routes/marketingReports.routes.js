import express from 'express';
import { getSentimentAnalysis, getRatingRevenueCorrelation } from '../controllers/marketingReports.controller.js';
import { requireAuth, requireStaff } from '../middleware/authMiddleware.js';

const router = express.Router();

// Rapoartele de marketing sunt disponibile personalului și adminilor
router.use(requireAuth);
router.use(requireStaff);

// Analiza sentimentului recenziilor (pozitive / neutre / negative)
router.get('/sentiment', getSentimentAnalysis);

// Corelația între rating-ul mediu și veniturile generate de locații
router.get('/correlation', getRatingRevenueCorrelation);

export default router;
