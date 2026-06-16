import { Router } from 'express';
import { getUserProgress, syncProgress, toggleProgressItem } from '../controllers/progressController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getUserProgress);
router.post('/sync', syncProgress);
router.post('/toggle', toggleProgressItem);

export default router;
