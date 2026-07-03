import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../../middleware/authenticate';

const router = Router();

router.use(authenticate);

// Checkout endpoint has been largely superseded by /payments/create-order
// Keep this if the frontend still calls it for calculating totals before payment
router.post('/summary', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { getCart } = await import('../../lib/firestore/cart');
    const cart = await getCart(req.user!.sub);
    res.json({
      success: true,
      data: {
        subtotal: cart ? cart.items.reduce((sum, item) => sum + (item.quantity * 10), 0) : 0,
        deliveryFee: 0,
        handlingFee: 5,
        total: (cart ? cart.items.reduce((sum, item) => sum + (item.quantity * 10), 0) : 0) + 5
      }
    });
  } catch (err) { next(err); }
});

export default router;
