import express from 'express';
import {
    getAllLoyaltyCards,
    getLoyaltyCardById,
    createLoyaltyCard,
    updateLoyaltyCard,
    deleteLoyaltyCard,
} from '../controllers/loyaltyCards.controller.js';
import { requireAuth, requireSuperadmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllLoyaltyCards);
router.get('/:id', getLoyaltyCardById);

// Admin only routes
router.post('/', requireSuperadmin, createLoyaltyCard);
router.put('/:id', requireSuperadmin, updateLoyaltyCard);
router.delete('/:id', requireSuperadmin, deleteLoyaltyCard);

export default router;
