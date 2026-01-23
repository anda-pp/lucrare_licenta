import express from 'express';
import { getAllOrders, getOrderById, updateOrderStatus } from '../controllers/orders.controller.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);
router.use(requireAdmin);

router.get('/', getAllOrders);
router.get('/:id', getOrderById);
router.put('/:id/status', updateOrderStatus);

export default router;
