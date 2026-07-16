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

// Tipurile de carduri de fidelitate sunt vizibile public (afișate pe pagina de prezentare)
router.get('/', getAllLoyaltyCards);
router.get('/:id', getLoyaltyCardById);

// Crearea, editarea și ștergerea tipurilor de card — exclusiv superadmin
router.post('/', requireSuperadmin, createLoyaltyCard);
router.put('/:id', requireSuperadmin, updateLoyaltyCard);
router.delete('/:id', requireSuperadmin, deleteLoyaltyCard);

export default router;
