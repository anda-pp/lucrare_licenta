import express from 'express';
import {
    getAllUsers,
    getUserById,
    deleteUser,
    getDashboardStats,
} from '../controllers/admin.controller.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(requireAuth);
router.use(requireAdmin);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Users management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.delete('/users/:id', deleteUser);

export default router;

