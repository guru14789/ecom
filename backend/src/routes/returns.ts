import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { getReturnRequests, createReturnRequest, cancelReturnRequest } from '../controllers/returnController';

const router = Router();

router.get('/', authenticate, getReturnRequests);
router.post('/', authenticate, createReturnRequest);
router.post('/:id/cancel', authenticate, cancelReturnRequest);

export default router;
