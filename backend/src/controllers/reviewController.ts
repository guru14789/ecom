import { Response, NextFunction } from 'express';
import { Review } from '../models/Review';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { NotFoundError, AppError } from '../utils/errors';

export async function getProductReviews(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { productId } = req.params;
    const { page = '1', limit = '20', sort = 'recent', rating } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, unknown> = { productId, isApproved: true };
    if (rating) filter.rating = parseInt(rating, 10);

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === 'helpful') sortOption = { helpfulCount: -1, createdAt: -1 };

    const [data, total, ratingAgg] = await Promise.all([
      Review.find(filter).sort(sortOption).skip(skip).limit(limitNum).lean(),
      Review.countDocuments(filter),
      Review.aggregate([
        { $match: { productId, isApproved: true } },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
      ]),
    ]);

    const ratingDistribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratingAgg.forEach((r) => { ratingDistribution[r._id] = r.count; });

    res.json({
      data,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
      ratingDistribution,
      averageRating: data.reduce((s, r) => s + r.rating, 0) / (data.length || 1),
    });
  } catch (err) {
    next(err);
  }
}

export async function createReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { productId, orderId, rating, title, body, images } = req.body;

    const order = await Order.findOne({ _id: orderId, userId: req.user!.sub, status: 'delivered' });
    if (!order) {
      throw new AppError('VALIDATION_ERROR', 'Only delivered orders can be reviewed', 400);
    }

    const existing = await Review.findOne({ productId, userId: req.user!.sub });
    if (existing) {
      throw new AppError('VALIDATION_ERROR', 'You have already reviewed this product', 400);
    }

    const hasPurchased = order.items.some((i) => i.productId === productId);
    const review = await Review.create({
      productId,
      userId: req.user!.sub,
      orderId,
      rating,
      title,
      body,
      images: images || [],
      isVerifiedPurchase: hasPurchased,
    });

    await Product.findByIdAndUpdate(productId, {
      $inc: { reviews: 1 },
      $set: { rating: await calculateAverageRating(productId) },
    });

    res.status(201).json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
}

export async function markReviewHelpful(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) throw new NotFoundError('Review not found');

    const userId = req.user!.sub;
    if (review.helpfulBy.includes(userId)) {
      review.helpfulBy = review.helpfulBy.filter((id) => id !== userId);
      review.helpfulCount = Math.max(0, review.helpfulCount - 1);
    } else {
      review.helpfulBy.push(userId);
      review.helpfulCount += 1;
    }
    await review.save();
    res.json({ success: true, helpfulCount: review.helpfulCount });
  } catch (err) {
    next(err);
  }
}

export async function deleteReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const review = await Review.findOneAndDelete({ _id: req.params.id, userId: req.user!.sub });
    if (!review) throw new NotFoundError('Review not found');

    await Product.findByIdAndUpdate(review.productId, {
      $inc: { reviews: -1 },
      $set: { rating: await calculateAverageRating(review.productId) },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function calculateAverageRating(productId: string): Promise<number> {
  const result = await Review.aggregate([
    { $match: { productId, isApproved: true } },
    { $group: { _id: null, avg: { $avg: '$rating' } } },
  ]);
  return result.length > 0 ? Math.round(result[0].avg * 10) / 10 : 0;
}
