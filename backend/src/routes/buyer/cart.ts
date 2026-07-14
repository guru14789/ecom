import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../../middleware/authenticate';
import { getCart, addToCart, updateCartItem, clearCart } from '../../lib/firestore/cart';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await getCart(req.user!.sub);
    res.json({ data });
  } catch (err) { next(err); }
});

router.post('/add', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await addToCart(req.user!.sub, req.body);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.put('/update', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { productId, quantity, variantId } = req.body;
    const data = await updateCartItem(req.user!.sub, productId, quantity, variantId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.delete('/remove/:productId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    let data = await getCart(req.user!.sub);
    if (data) {
      const items = data.items.filter(i => i.productId !== req.params.productId);
      const { db } = await import('../../lib/firestore/client');
      await db.collection('cart').doc(req.user!.sub).update({ items });
      data.items = items;
    }
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.post('/sync', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { items } = req.body;
    const { setCart } = await import('../../lib/firestore/cart');
    await setCart(req.user!.sub, items || []);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
