import { Router } from 'express';
import { getGroups, getGroupById, startGroup, joinGroup, getLiveCounts } from '../controllers/groupController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.get('/', getGroups);
router.get('/live', getLiveCounts);
router.get('/:id', getGroupById);
router.post('/start', authenticate, startGroup);
router.post('/:id/join', authenticate, joinGroup);

export default router;
