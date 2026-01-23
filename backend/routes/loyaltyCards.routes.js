import express from 'express';
import {
    getAllLoyaltyCards,
    getLoyaltyCardById,
    createLoyaltyCard,
    updateLoyaltyCard,
    deleteLoyaltyCard,
} from '../controllers/loyaltyCards.controller.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllLoyaltyCards);
router.get('/:id', getLoyaltyCardById);

// Admin only routes
router.post('/', requireAdmin, createLoyaltyCard);
router.put('/:id', requireAdmin, updateLoyaltyCard);
router.delete('/:id', requireAdmin, deleteLoyaltyCard);

export default router;
