import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { createDispute, getDisputes, addDisputeMessage, resolveDispute } from '../controllers/disputeController';

const router = Router();

router.post('/', authenticate, createDispute);
router.get('/', authenticate, getDisputes);
router.post('/:id/messages', authenticate, addDisputeMessage);
router.patch('/:id/resolve', authenticate, authorize('admin', 'super_admin'), resolveDispute);

export default router;
