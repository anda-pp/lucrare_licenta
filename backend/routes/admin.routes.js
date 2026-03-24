import express from 'express';
import {
    getAllUsers,
    getUserById,
    deleteUser,
    getDashboardStats,
    getAllReservations,
} from '../controllers/admin.controller.js';
import { requireAuth, requireSuperadmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(requireAuth);
router.use(requireSuperadmin);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Users management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.delete('/users/:id', deleteUser);

// Reservations management
router.get('/reservations', getAllReservations);

export default router;

