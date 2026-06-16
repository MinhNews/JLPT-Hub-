import { Router } from 'express';
import { getGrammarList, getGrammarById } from '../controllers/grammarController';

const router = Router();

router.get('/', getGrammarList);
router.get('/:id', getGrammarById);

export default router;
