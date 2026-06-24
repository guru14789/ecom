import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import {
  getActiveFlashSales, getFlashSaleById,
  createFlashSale, updateFlashSale, deleteFlashSale, getAllFlashSales,
} from '../controllers/flashSaleController';

const router = Router();

router.get('/active', getActiveFlashSales);
router.get('/', authenticate, authorize('admin', 'super_admin'), getAllFlashSales);
router.get('/:id', getFlashSaleById);
router.post('/', authenticate, authorize('admin', 'super_admin'), createFlashSale);
router.put('/:id', authenticate, authorize('admin', 'super_admin'), updateFlashSale);
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), deleteFlashSale);

export default router;
