import { Router } from 'express';
import { getCart, addCartItem, updateCartItem, removeCartItem, clearCart, applyCoupon } from '../controllers/cartController';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/', getCart);
router.post('/items', addCartItem);
router.put('/items/:productId', updateCartItem);
router.delete('/items/:productId', removeCartItem);
router.delete('/', clearCart);
router.post('/coupon', applyCoupon);

export default router;
