import { Router } from 'express';
import { authenticateToken, authorizeAdmin } from '../middleware/auth';
import {
  getSystemStats,
  getAllUsers,
  toggleUserVip,
  toggleUserStatus,
  updateUserRole
} from '../controllers/adminController';

const router = Router();

// Apply admin protection to all routes in this file
router.use(authenticateToken);
router.use(authorizeAdmin);

// Admin dashboard routes
router.get('/stats', getSystemStats);
router.get('/users', getAllUsers);
router.put('/users/:id/vip', toggleUserVip);
router.put('/users/:id/status', toggleUserStatus);
router.put('/users/:id/role', updateUserRole);

export default router;
