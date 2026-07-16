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

// Toate rutele de admin necesită autentificare și rolul Superadmin
router.use(requireAuth);
router.use(requireSuperadmin);

// Statistici pentru dashboard-ul superadmin-ului
router.get('/dashboard', getDashboardStats);

// Gestionarea utilizatorilor — listare, vizualizare, ștergere
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.delete('/users/:id', deleteUser);

// Rezervările tuturor evenimentelor din platformă (vizualizare globală)
router.get('/reservations', getAllReservations);

export default router;
