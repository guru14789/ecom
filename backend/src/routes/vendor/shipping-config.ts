import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import { getVendorById, updateVendor } from '../../lib/firestore/vendors';
import { auditLog } from '../../services/audit.service';
import { NotFoundError } from '../../utils/errors';

const router = Router();

// GET /api/vendor/shipping — Load shipping config from vendor document
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const vendor = await getVendorById(vendorId);
    if (!vendor) throw new NotFoundError('Vendor not found');

    const shippingConfig = (vendor as any).shippingConfig || {
      couriers: [
        { id: 'delhivery', name: 'Delhivery Logistics', enabled: true },
        { id: 'bluedart', name: 'BlueDart Express', enabled: true },
        { id: 'ekart', name: 'EKART Logistics', enabled: false },
        { id: 'shiprocket', name: 'Shiprocket Multi-carrier', enabled: false },
      ],
      deliveryMode: 'automatic',
      shippingFeeType: 'flat',
      flatRate: 40,
      freeAboveLimit: 500,
    };

    res.json({ data: shippingConfig });
  } catch (err) { next(err); }
});

// PUT /api/vendor/shipping — Persist shipping config to vendor document
router.put('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const vendor = await getVendorById(vendorId);
    if (!vendor) throw new NotFoundError('Vendor not found');

    const { couriers, deliveryMode, shippingFeeType, flatRate, freeAboveLimit } = req.body;

    const shippingConfig = {
      couriers: couriers || [],
      deliveryMode: deliveryMode || 'automatic',
      shippingFeeType: shippingFeeType || 'flat',
      flatRate: parseFloat(flatRate) || 40,
      freeAboveLimit: parseFloat(freeAboveLimit) || 500,
    };

    await updateVendor(vendorId, { shippingConfig } as any);

    auditLog({
      actorId: req.user!.sub,
      actorType: 'vendor',
      action: 'update_shipping_config',
      resourceType: 'vendor',
      resourceId: vendorId,
      metadata: { shippingFeeType, deliveryMode },
    });

    res.json({ success: true, data: shippingConfig });
  } catch (err) { next(err); }
});

export default router;
