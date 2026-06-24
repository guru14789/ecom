import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { getProductReviews, createReview, markReviewHelpful, deleteReview } from '../controllers/reviewController';

const router = Router();

router.get('/product/:productId', getProductReviews);
router.post('/', authenticate, createReview);
router.post('/:id/helpful', authenticate, markReviewHelpful);
router.delete('/:id', authenticate, deleteReview);

export default router;
