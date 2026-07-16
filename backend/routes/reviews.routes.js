import express from 'express';
import { getAllReviews, deleteReview } from '../controllers/reviews.controller.js';
import { requireAuth, requireSuperadmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Gestionarea recenziilor la nivel global — doar superadmin poate vizualiza și șterge
router.use(requireAuth);
router.use(requireSuperadmin);

router.get('/', getAllReviews);
router.delete('/:id', deleteReview);

export default router;
