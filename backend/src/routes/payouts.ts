import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { getPayouts, getPayoutById, getAllPayouts, generatePayoutBatch, markPayoutPaid } from '../controllers/payoutController';

const router = Router();

router.get('/', authenticate, authorize('vendor', 'vendor_admin'), getPayouts);
router.get('/all', authenticate, authorize('admin', 'super_admin'), getAllPayouts);
router.get('/:id', authenticate, authorize('vendor', 'vendor_admin'), getPayoutById);
router.post('/batch', authenticate, authorize('admin', 'super_admin'), generatePayoutBatch);
router.patch('/:id/paid', authenticate, authorize('admin', 'super_admin'), markPayoutPaid);

export default router;
