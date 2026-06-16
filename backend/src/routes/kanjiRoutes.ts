import { Router } from 'express';
import { getKanjiList, getKanjiLessons } from '../controllers/kanjiController';

const router = Router();

router.get('/', getKanjiList);
router.get('/lessons', getKanjiLessons);

export default router;
