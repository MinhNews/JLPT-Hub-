import { Router } from 'express';
import { getVocabList, getVocabCategories } from '../controllers/vocabController';

const router = Router();

router.get('/', getVocabList);
router.get('/categories', getVocabCategories);

export default router;
