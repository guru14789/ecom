import { Response, NextFunction } from 'express';
import { Question } from '../models/Question';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { NotFoundError, AppError } from '../utils/errors';

export async function getProductQuestions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { productId } = req.params;
    const { page = '1', limit = '20' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      Question.find({ productId }).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Question.countDocuments({ productId }),
    ]);

    res.json({
      data,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
}

export async function createQuestion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { productId, body } = req.body;
    if (!body?.trim()) {
      throw new AppError('VALIDATION_ERROR', 'Question body is required', 422);
    }

    const question = await Question.create({ productId, userId: req.user!.sub, body });
    res.status(201).json({ success: true, data: question });
  } catch (err) {
    next(err);
  }
}

export async function createAnswer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { body } = req.body;
    const question = await Question.findById(req.params.questionId);
    if (!question) throw new NotFoundError('Question not found');

    const userType = req.user!.role === 'vendor' || req.user!.role === 'vendor_admin' ? 'vendor' : 'buyer';
    const answer = {
      _id: undefined as unknown as string,
      body,
      userId: req.user!.sub,
      userType,
      isAccepted: false,
      helpfulCount: 0,
      createdAt: new Date(),
    };

    question.answers.push(answer as any);
    question.answerCount = question.answers.length;
    await question.save();

    res.status(201).json({ success: true, data: question });
  } catch (err) {
    next(err);
  }
}

export async function markAnswerHelpful(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const question = await Question.findById(req.params.questionId);
    if (!question) throw new NotFoundError('Question not found');

    const answer = question.answers.find((a) => a._id === req.params.answerId);
    if (!answer) throw new NotFoundError('Answer not found');

    answer.helpfulCount += 1;
    await question.save();

    res.json({ success: true, helpfulCount: answer.helpfulCount });
  } catch (err) {
    next(err);
  }
}
