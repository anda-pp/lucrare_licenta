import express from 'express';
import { getAllOrders, getOrderById, updateOrderStatus } from '../controllers/orders.controller.js';
import { requireAuth, requireSuperadmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Gestionarea comenzilor — exclusiv superadmin (vizualizare globală + actualizare status)
router.use(requireAuth);
router.use(requireSuperadmin);

router.get('/', getAllOrders);
router.get('/:id', getOrderById);
router.put('/:id/status', updateOrderStatus);

export default router;
