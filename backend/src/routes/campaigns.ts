import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { getCampaigns, createCampaign, updateCampaign, deleteCampaign, sendCampaign } from '../controllers/campaignController';

const router = Router();

router.get('/', authenticate, authorize('admin', 'super_admin'), getCampaigns);
router.post('/', authenticate, authorize('admin', 'super_admin'), createCampaign);
router.put('/:id', authenticate, authorize('admin', 'super_admin'), updateCampaign);
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), deleteCampaign);
router.post('/:id/send', authenticate, authorize('admin', 'super_admin'), sendCampaign);

export default router;
