import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import { getOrderById } from '../../lib/firestore/orders';
import { getReturnById, listReturnsByVendor, updateReturn } from '../../lib/firestore/returns';
import { updateVendorOrderStatus } from '../../lib/firestore/orders';

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
    const returnReq = await getReturnById(req.params.id);
    if (!returnReq) throw new Error('Return request not found');
    
    await updateReturn(req.params.id, { status: 'approved', refundAmount: req.body.refundAmount });
    await updateVendorOrderStatus(returnReq.orderId, returnReq.vendorId, 'returned');
    
    try {
      const { getUserById } = await import('../../lib/firestore/users');
      const { sendReturnUpdate } = await import('../../services/email');
      const buyer = await getUserById(returnReq.userId);
      if (buyer?.email) sendReturnUpdate(buyer.email, returnReq.orderId, 'approved');
    } catch (err) {
      console.error('Failed to send return email:', err);
    }

    res.json({ success: true });
  } catch (err) { next(err); }
});

router.put('/:id/reject', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const returnReq = await getReturnById(req.params.id);
    if (!returnReq) throw new Error('Return request not found');

    await updateReturn(req.params.id, { status: 'rejected', adminNote: req.body.reason });
    await updateVendorOrderStatus(returnReq.orderId, returnReq.vendorId, 'delivered'); // Revert to delivered

    try {
      const { getUserById } = await import('../../lib/firestore/users');
      const { sendReturnUpdate } = await import('../../services/email');
      const buyer = await getUserById(returnReq.userId);
      if (buyer?.email) sendReturnUpdate(buyer.email, returnReq.orderId, 'rejected');
    } catch (err) {
      console.error('Failed to send return email:', err);
    }

    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
