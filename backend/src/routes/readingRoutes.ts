import { Router } from 'express';
import { getAllReadingLessons, getReadingLessonById } from '../controllers/readingController';

const router = Router();

router.get('/', getAllReadingLessons);
router.get('/:id', getReadingLessonById);

export default router;
