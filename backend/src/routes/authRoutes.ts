import { Router } from 'express';
import { registerUser, loginUser } from '../controllers/authController';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { User } from '../models/User';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.user?.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Server Error' });
  }
});

export default router;
