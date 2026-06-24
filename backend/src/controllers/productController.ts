import { Request, Response, NextFunction } from 'express';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { NotFoundError } from '../utils/errors';

export async function getProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      page = '1',
      limit = '20',
      category,
      categories,
      minPrice,
      maxPrice,
      minRating,
      sort = 'relevance',
      q,
      inStock,
      brand,
      brands,
      minDiscount,
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, unknown> = { isActive: true };

    if (q) {
      filter.$text = { $search: q };
    }

    const catList = categories ? categories.split(',') : category && category !== 'all' ? [category] : [];
    if (catList.length > 0) {
      filter.category = { $in: catList };
    }

    const brandList = brands ? brands.split(',') : brand ? [brand] : [];
    if (brandList.length > 0) {
      filter.brand = { $in: brandList };
    }

    const priceFilter: Record<string, number> = {};
    if (minPrice) priceFilter.$gte = parseFloat(minPrice);
    if (maxPrice) priceFilter.$lte = parseFloat(maxPrice);
    if (Object.keys(priceFilter).length > 0) {
      filter.price = priceFilter;
    }

    if (minRating) {
      filter.rating = { $gte: parseFloat(minRating) };
    }

    if (inStock === 'true') {
      filter.stock = { $gt: 0 };
    }

    if (minDiscount) {
      const disc = parseFloat(minDiscount);
      if (disc > 0) {
        filter.$expr = {
          $gte: [
            { $divide: [{ $subtract: ['$mrp', '$price'] }, '$mrp'] },
            disc / 100,
          ],
        };
      }
    }

    type SortOption = Record<string, 1 | -1> | Record<string, { $meta: string }>;
    let sortOption: SortOption = {};
    switch (sort) {
      case 'price_asc':
        sortOption = { price: 1 };
        break;
      case 'price_desc':
        sortOption = { price: -1 };
        break;
      case 'rating':
        sortOption = { rating: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'popularity':
        sortOption = { reviews: -1 };
        break;
      default:
        sortOption = q ? { score: { $meta: 'textScore' } } : { rating: -1 };
        break;
    }

    let query = Product.find(filter);
    if (q) {
      query = query.select({ score: { $meta: 'textScore' } }) as typeof query;
    }
    query = query.sort(sortOption).skip(skip).limit(limitNum);

    const [data, total] = await Promise.all([
      query.lean(),
      Product.countDocuments(filter),
    ]);

    const facetFilter = { isActive: true } as Record<string, unknown>;

    const [brandsResult, categoriesResult, priceRange] = await Promise.all([
      Product.distinct('brand', facetFilter).then((b) =>
        b.filter(Boolean).sort()
      ),
      Product.aggregate([
        { $match: facetFilter },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Product.aggregate([
        { $match: facetFilter },
        {
          $group: {
            _id: null,
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' },
          },
        },
      ]),
    ]);

    res.json({
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
      facets: {
        brands: brandsResult,
        categories: categoriesResult.map((c: { _id: string; count: number }) => ({
          key: c._id,
          count: c.count,
        })),
        priceRange: priceRange[0] || { minPrice: 0, maxPrice: 0 },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getProductById(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      throw new NotFoundError('The requested product does not exist or has been removed.');
    }

    res.json({ data: product });
  } catch (err) {
    next(err);
  }
}

export async function searchProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const { q = '', page = '1', limit = '20', ...filters } = req.query as Record<string, string>;

    if (!q.trim()) {
      return getProducts(req, res, next);
    }

    req.query = { ...req.query, q, page, limit, ...filters };
    return getProducts(req, res, next);
  } catch (err) {
    next(err);
  }
}

export async function autocomplete(req: Request, res: Response, next: NextFunction) {
  try {
    const { q = '', limit = '8' } = req.query as Record<string, string>;

    if (!q.trim()) {
      return res.json({ data: [] });
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const results = await Product.find(
      { isActive: true, name: regex },
      { name: 1, slug: 1, price: 1, mrp: 1, image: 1, brand: 1, category: 1, stock: 1 }
    )
      .limit(parseInt(limit, 10) || 8)
      .sort({ reviews: -1 })
      .lean();

    const suggestions = results.map((p) => ({
      _id: p._id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      mrp: p.mrp,
      image: p.image,
      brand: p.brand,
      category: p.category,
      inStock: (p.stock || 0) > 0,
    }));

    res.json({ data: suggestions });
  } catch (err) {
    next(err);
  }
}

export async function getSearchSuggestions(_req: Request, res: Response, next: NextFunction) {
  try {
    const popular = await Product.find({ isActive: true })
      .sort({ reviews: -1 })
      .limit(10)
      .select('name')
      .lean();

    const suggestions = {
      popular: popular.map((p) => p.name),
      categories: await Category.find({ isActive: true })
        .sort({ order: 1 })
        .limit(8)
        .select('label key')
        .lean(),
    };

    res.json({ data: suggestions });
  } catch (err) {
    next(err);
  }
}

export async function getCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ order: 1 })
      .lean();

    res.json({ data: categories });
  } catch (err) {
    next(err);
  }
}
