import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import { listReturnsByVendor, updateReturn } from '../../lib/firestore/returns';
import { getOrderById } from '../../lib/firestore/orders';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const data = await listReturnsByVendor(vendorId);
    res.json({ data });
  } catch (err) { next(err); }
});

router.put('/:id/approve', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await updateReturn(req.params.id, { status: 'approved', refundAmount: req.body.refundAmount });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.put('/:id/reject', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await updateReturn(req.params.id, { status: 'rejected', adminNote: req.body.reason });
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
