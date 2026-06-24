import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { getProductQuestions, createQuestion, createAnswer, markAnswerHelpful } from '../controllers/questionController';

const router = Router();

router.get('/product/:productId', getProductQuestions);
router.post('/', authenticate, createQuestion);
router.post('/:questionId/answers', authenticate, createAnswer);
router.post('/:questionId/answers/:answerId/helpful', authenticate, markAnswerHelpful);

export default router;
