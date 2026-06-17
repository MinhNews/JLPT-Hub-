import express from 'express';
import { getGrammarList, getGrammarById, getGrammarQuestions } from '../controllers/grammarController';

const router = express.Router();

router.get('/', getGrammarList);
router.get('/questions', getGrammarQuestions);
router.get('/:id', getGrammarById);

export default router;
