import { Router } from 'express';
import { getNotebookEntries, upsertNotebookEntry, deleteNotebookEntry } from '../controllers/notebookController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getNotebookEntries);
router.post('/', upsertNotebookEntry);
router.delete('/:id', deleteNotebookEntry);

export default router;
