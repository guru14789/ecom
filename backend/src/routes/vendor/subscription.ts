import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import { getVendorSubscription, upgradeSubscription, SUBSCRIPTION_TIERS } from '../../services/subscription.service';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const subscription = await getVendorSubscription(vendorId);
    res.json({ data: { subscription, tiers: SUBSCRIPTION_TIERS } });
  } catch (err) { next(err); }
});

router.post('/upgrade', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const { tier, razorpayPaymentId } = req.body;
    const subscription = await upgradeSubscription(vendorId, tier, razorpayPaymentId);
    res.json({ success: true, data: subscription });
  } catch (err) { next(err); }
});

export default router;
