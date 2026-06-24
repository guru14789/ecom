import { Response, NextFunction } from 'express';
import { GroupSession } from '../models/GroupSession';
import { Product } from '../models/Product';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { NotFoundError, AppError } from '../utils/errors';

export async function getGroups(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { productId, status = 'active' } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = {};
    if (productId) filter.productId = productId;
    if (status && status !== 'all') filter.status = status;

    const groups = await GroupSession.find(filter)
      .sort({ startedAt: -1 })
      .limit(50)
      .lean();

    res.json({ data: groups });
  } catch (err) {
    next(err);
  }
}

export async function getGroupById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const group = await GroupSession.findById(req.params.id).lean();
    if (!group) {
      throw new NotFoundError('Group session not found');
    }

    res.json({ data: group });
  } catch (err) {
    next(err);
  }
}

export async function startGroup(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { productId, durationHours = 24 } = req.body;

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      throw new NotFoundError('Product not found');
    }

    if (!product.groupPrice || product.groupPrice >= product.price) {
      throw new AppError('INVALID_PRODUCT', 'This product does not have a valid group price', 400);
    }

    const existingActive = await GroupSession.findOne({
      productId,
      status: 'active',
    });

    if (existingActive) {
      throw new AppError('SESSION_EXISTS', 'An active group session already exists for this product', 409);
    }

    const activeSessionsCount = await GroupSession.countDocuments({
      hostUserId: req.user!.sub,
      status: 'active',
    });

    if (activeSessionsCount >= 10) {
      throw new AppError('LIMIT_EXCEEDED', 'Maximum active sessions per user is 10', 400);
    }

    const maxDuration = Math.min(Math.max(durationHours, 2), 168);
    const endsAt = new Date(Date.now() + maxDuration * 60 * 60 * 1000);

    const session = await GroupSession.create({
      productId,
      hostUserId: req.user!.sub,
      targetCount: product.targetCount,
      currentCount: 1,
      participants: [{
        userId: req.user!.sub,
        joinedAt: new Date(),
      }],
      status: 'active',
      startedAt: new Date(),
      endsAt,
    });

    res.status(201).json({
      success: true,
      data: {
        sessionId: session._id,
        shareCode: session.shareCode,
        shareUrl: session.shareUrl,
        endsAt: session.endsAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function joinGroup(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const session = await GroupSession.findById(req.params.id);

    if (!session) {
      throw new NotFoundError('Group session not found');
    }

    if (session.status !== 'active') {
      throw new AppError('SESSION_CLOSED', 'This group session is no longer active', 400);
    }

    if (session.endsAt <= new Date()) {
      session.status = 'expired';
      await session.save();
      throw new AppError('SESSION_EXPIRED', 'This group session has expired', 400);
    }

    const alreadyJoined = session.participants.some(
      (p) => p.userId === req.user!.sub
    );

    if (alreadyJoined) {
      throw new AppError('ALREADY_JOINED', 'You have already joined this group', 409);
    }

    session.participants.push({ userId: req.user!.sub, joinedAt: new Date() });
    session.currentCount += 1;

    if (session.currentCount >= session.targetCount) {
      session.status = 'completed';
      session.completedAt = new Date();
      session.appliedPrice = (await Product.findById(session.productId))?.groupPrice;
    }

    await session.save();

    res.json({
      success: true,
      data: {
        sessionId: session._id,
        currentCount: session.currentCount,
        targetCount: session.targetCount,
        status: session.status,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getLiveCounts(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const groups = await GroupSession.find({ status: 'active' })
      .select('_id productId currentCount targetCount')
      .lean();

    res.json({ data: groups });
  } catch (err) {
    next(err);
  }
}
