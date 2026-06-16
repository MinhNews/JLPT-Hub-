import { Router } from 'express';
import { getExamsList, getExamDetails } from '../controllers/examController';

const router = Router();

router.get('/:level', getExamsList);
router.get('/:level/:id', getExamDetails);

export default router;
