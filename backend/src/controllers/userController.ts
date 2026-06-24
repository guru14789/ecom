import { Response, NextFunction } from 'express';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { NotFoundError, AppError } from '../utils/errors';
import { generateId } from '../utils/helpers';

export async function getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.user!.sub)
      .select('-refreshTokenHash')
      .lean();

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.json({ data: user });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { fullName, email, avatar } = req.body;
    const updates: Record<string, unknown> = {};

    if (fullName !== undefined) updates.fullName = fullName;
    if (email !== undefined) updates.email = email;
    if (avatar !== undefined) updates.avatar = avatar;

    if (Object.keys(updates).length === 0) {
      throw new AppError('VALIDATION_ERROR', 'No fields to update', 422);
    }

    const user = await User.findByIdAndUpdate(
      req.user!.sub,
      { $set: updates },
      { new: true, select: '-refreshTokenHash' }
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function getAddresses(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.user!.sub).select('addresses').lean();
    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.json({ data: user.addresses || [] });
  } catch (err) {
    next(err);
  }
}

export async function addAddress(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { houseNo, area, pincode, landmark, city, state, tag, isDefault } = req.body;

    const user = await User.findById(req.user!.sub);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const newAddress = {
      _id: generateId('addr', 8),
      houseNo,
      area,
      pincode,
      landmark,
      city,
      state,
      tag: tag || 'Home',
      isDefault: isDefault || user.addresses.length === 0,
    };

    if (newAddress.isDefault) {
      user.addresses.forEach((addr) => { addr.isDefault = false; });
    }

    user.addresses.push(newAddress as typeof user.addresses[0]);
    await user.save();

    res.status(201).json({ success: true, data: user.addresses });
  } catch (err) {
    next(err);
  }
}

export async function updateAddress(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await User.findById(req.user!.sub);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const address = user.addresses.find((a) => a._id === id);
    if (!address) {
      throw new NotFoundError('Address not found');
    }

    if (updates.houseNo !== undefined) address.houseNo = updates.houseNo;
    if (updates.area !== undefined) address.area = updates.area;
    if (updates.pincode !== undefined) address.pincode = updates.pincode;
    if (updates.landmark !== undefined) address.landmark = updates.landmark;
    if (updates.city !== undefined) address.city = updates.city;
    if (updates.state !== undefined) address.state = updates.state;
    if (updates.tag !== undefined) address.tag = updates.tag;

    if (updates.isDefault) {
      user.addresses.forEach((a) => { a.isDefault = false; });
      address.isDefault = true;
    }

    await user.save();
    res.json({ success: true, data: user.addresses });
  } catch (err) {
    next(err);
  }
}

export async function deleteAddress(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const user = await User.findById(req.user!.sub);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    user.addresses = user.addresses.filter((a) => a._id !== id);
    await user.save();

    res.json({ success: true, data: user.addresses });
  } catch (err) {
    next(err);
  }
}

export async function getWishlist(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.user!.sub).select('wishlist').lean();
    res.json({ data: (user as any)?.wishlist || [] });
  } catch (err) {
    next(err);
  }
}

export async function addToWishlist(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user!.sub);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const wishlist = (user as any).wishlist || [];
    if (!wishlist.includes(productId)) {
      wishlist.push(productId);
    }

    (user as any).wishlist = wishlist;
    await user.save();

    res.json({ success: true, data: wishlist });
  } catch (err) {
    next(err);
  }
}

export async function removeFromWishlist(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user!.sub);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const wishlist = ((user as any).wishlist || []).filter(
      (id: string) => id !== productId
    );
    (user as any).wishlist = wishlist;
    await user.save();

    res.json({ success: true, data: wishlist });
  } catch (err) {
    next(err);
  }
}

export async function getWallet(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.user!.sub)
      .select('walletBalance walletTransactions')
      .lean();

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.json({
      data: {
        balance: user.walletBalance,
        transactions: (user.walletTransactions || []).reverse(),
      },
    });
  } catch (err) {
    next(err);
  }
}
