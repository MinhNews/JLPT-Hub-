import { Router } from 'express';
import { getNotebookEntries, upsertNotebookEntry, updateNotebookEntry, patchNotebookEntry, deleteNotebookEntry } from '../controllers/notebookController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getNotebookEntries);
router.post('/', upsertNotebookEntry);
router.put('/:id', updateNotebookEntry);
router.patch('/:id', patchNotebookEntry);
router.delete('/:id', deleteNotebookEntry);

export default router;
