import { Router } from 'express';
import { updateProfile, uploadAvatar } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.put('/profile', authenticateToken, updateProfile);
router.post('/profile/avatar', authenticateToken, uploadAvatar);

export default router;
