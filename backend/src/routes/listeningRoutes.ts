import { Router } from 'express';
import { getAllListeningLessons, getListeningLessonById } from '../controllers/listeningController';

const router = Router();

router.get('/', getAllListeningLessons);
router.get('/:id', getListeningLessonById);

export default router;
