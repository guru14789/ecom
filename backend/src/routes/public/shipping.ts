import { Router, Request, Response, NextFunction } from 'express';
import { env } from '../../config/env';

const router = Router();

// Cache for pincode checks to avoid hitting Delhivery API too often
const pincodeCache = new Map<string, { serviceable: boolean; cachedAt: number }>();

/**
 * GET /api/public/shipping/check-pincode
 * Checks if a pin code is serviceable by Delhivery (or fallback logic).
 */
router.get('/check-pincode', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pincode } = req.query;

    if (!pincode || typeof pincode !== 'string' || pincode.length !== 6) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PINCODE', message: 'Please provide a valid 6-digit Indian pin code.' },
      });
    }

    // Check cache first (valid for 24 hours)
    const cached = pincodeCache.get(pincode);
    if (cached && Date.now() - cached.cachedAt < 24 * 60 * 60 * 1000) {
      return res.json({ success: true, data: { pincode, serviceable: cached.serviceable } });
    }

    // Mock logic: If no Delhivery token is provided, assume all non-9-starting pin codes are serviceable.
    let serviceable = true;

    if (env.DELHIVERY_API_KEY) {
      // TODO: Integrate actual Delhivery Serviceability API
      // e.g. GET https://track.delhivery.com/c/api/pin-codes/json/?filter_codes={pincode}
      // For now, we simulate an API call
      await new Promise((resolve) => setTimeout(resolve, 500));
    } else {
      // Fallback mock logic for development without keys
      if (pincode.startsWith('9')) {
        serviceable = false; // Mock unserviceable
      }
    }

    pincodeCache.set(pincode, { serviceable, cachedAt: Date.now() });

    res.json({
      success: true,
      data: {
        pincode,
        serviceable,
        message: serviceable ? 'Delivery available in this area' : 'Sorry, we do not deliver to this pin code yet.',
        estimatedDays: serviceable ? 3 : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
