import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../../middleware/authenticate';
import { getCart } from '../../lib/firestore/cart';
import { getProductById } from '../../lib/firestore/products';

const router = Router();

router.use(authenticate);

router.post('/summary', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const cart = await getCart(req.user!.sub);
    let subtotal = 0;
    let taxTotal = 0;

    let hasPhysicalItems = false;

    if (cart && cart.items.length > 0) {
      const products = await Promise.all(
        cart.items.map(item => getProductById(item.productId))
      );
      
      products.forEach((product, i) => {
        if (product) {
          const quantity = cart.items[i].quantity;
          let itemPrice = product.price;
          
          if (product.productType !== 'digital') {
            hasPhysicalItems = true;
          }

          if (cart.items[i].variantId) {
            const variant = product.variants?.find(v => v.id === cart.items[i].variantId);
            if (variant && variant.priceModifier) {
              itemPrice += variant.priceModifier;
            }
          }

          const taxRate = product.taxRate || 0;
          let itemTax = 0;

          if (taxRate > 0) {
            if (product.taxInclusive) {
              itemTax = itemPrice - (itemPrice / (1 + taxRate / 100));
              subtotal += (itemPrice - itemTax) * quantity;
            } else {
              itemTax = itemPrice * (taxRate / 100);
              subtotal += itemPrice * quantity;
            }
            taxTotal += itemTax * quantity;
          } else {
            subtotal += itemPrice * quantity;
          }
        }
      });
    }

    const deliveryFee = hasPhysicalItems ? (subtotal >= 499 ? 0 : 40) : 0;
    const handlingFee = Math.round((subtotal + taxTotal) * 0.02 * 100) / 100;
    const total = subtotal + taxTotal + deliveryFee + handlingFee;

    res.json({
      success: true,
      data: { 
        subtotal: Number(subtotal.toFixed(2)), 
        taxTotal: Number(taxTotal.toFixed(2)),
        deliveryFee, 
        handlingFee, 
        total: Number(total.toFixed(2)) 
      }
    });
  } catch (err) { next(err); }
});

export default router;
