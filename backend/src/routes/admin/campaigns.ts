import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import { listCampaigns, getCampaignById, updateCampaign, deleteCampaign, createCampaign } from '../../lib/firestore/campaigns';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await listCampaigns();
    res.json({ data });
  } catch (err) { next(err); }
});

router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await createCampaign(req.body);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.put('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await updateCampaign(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await deleteCampaign(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
