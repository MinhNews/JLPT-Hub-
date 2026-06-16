import { Router } from 'express';
import { getMinnaLessons, getMinnaLessonDetail } from '../controllers/minnaController';

const router = Router();

router.get('/lessons', getMinnaLessons);
router.get('/lessons/:number', getMinnaLessonDetail);

export default router;
