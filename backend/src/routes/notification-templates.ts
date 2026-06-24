import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '../controllers/notificationTemplateController';

const router = Router();

router.get('/', authenticate, authorize('admin', 'super_admin'), getTemplates);
router.post('/', authenticate, authorize('admin', 'super_admin'), createTemplate);
router.put('/:id', authenticate, authorize('admin', 'super_admin'), updateTemplate);
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), deleteTemplate);

export default router;
