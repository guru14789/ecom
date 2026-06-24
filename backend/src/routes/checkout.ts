import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  getDeliveryEstimate, checkPincodeServiceability,
  validateCoupon, getCheckoutSummary, checkCodAvailability,
} from '../controllers/checkoutController';

const router = Router();

router.get('/delivery-estimate', getDeliveryEstimate);
router.get('/pincode-serviceability', checkPincodeServiceability);
router.post('/validate-coupon', authenticate, validateCoupon);
router.post('/summary', authenticate, getCheckoutSummary);
router.get('/cod-availability', checkCodAvailability);

export default router;
