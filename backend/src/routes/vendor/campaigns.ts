import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import {
  listVendorCampaigns,
  createVendorCampaign,
  updateVendorCampaign,
  deleteVendorCampaign,
  getVendorCampaignById,
} from '../../lib/firestore/vendor-campaigns';
import { auditLog } from '../../services/audit.service';
import { AppError } from '../../utils/errors';

const router = Router();

// GET /api/vendor/campaigns
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const data = await listVendorCampaigns(vendorId);
    res.json({ data });
  } catch (err) { next(err); }
});

// POST /api/vendor/campaigns
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const { name, budget } = req.body;

    if (!name?.trim()) {
      return res.status(422).json({ error: 'VALIDATION_ERROR', message: 'Campaign name is required' });
    }

    const campaign = await createVendorCampaign({
      vendorId,
      name: name.trim(),
      budget: Math.max(10, parseFloat(budget) || 50),
    });

    auditLog({
      actorId: req.user!.sub,
      actorType: 'vendor',
      action: 'create_campaign',
      resourceType: 'vendor_campaign',
      resourceId: campaign.id,
      metadata: { name, budget },
    });

    res.status(201).json({ success: true, data: campaign });
  } catch (err) { next(err); }
});

// PUT /api/vendor/campaigns/:id
router.put('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const campaign = await getVendorCampaignById(req.params.id);

    if (!campaign) return res.status(404).json({ error: 'NOT_FOUND', message: 'Campaign not found' });
    if (campaign.vendorId !== vendorId) throw new AppError('FORBIDDEN', 'Not your campaign', 403);

    const { name, budget, status } = req.body;
    await updateVendorCampaign(req.params.id, { name, budget, status });

    auditLog({
      actorId: req.user!.sub,
      actorType: 'vendor',
      action: 'update_campaign',
      resourceType: 'vendor_campaign',
      resourceId: req.params.id,
      metadata: { name, budget, status },
    });

    res.json({ success: true });
  } catch (err) { next(err); }
});

// DELETE /api/vendor/campaigns/:id
router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const vendorId = req.user!.vendorId || req.user!.sub;
    const campaign = await getVendorCampaignById(req.params.id);

    if (!campaign) return res.status(404).json({ error: 'NOT_FOUND', message: 'Campaign not found' });
    if (campaign.vendorId !== vendorId) throw new AppError('FORBIDDEN', 'Not your campaign', 403);

    await deleteVendorCampaign(req.params.id);

    auditLog({
      actorId: req.user!.sub,
      actorType: 'vendor',
      action: 'delete_campaign',
      resourceType: 'vendor_campaign',
      resourceId: req.params.id,
    });

    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
