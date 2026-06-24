import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

router.get('/homepage', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { Product } = await import('../models/Product');
    const { FlashSale } = await import('../models/FlashSale');
    const { Category } = await import('../models/Category');

    const [featuredProducts, flashSales, categories, newArrivals, bestsellers] = await Promise.all([
      Product.find({ isActive: true, isFeatured: true }).sort({ rating: -1 }).limit(12).lean(),
      FlashSale.find({ isActive: true, startDate: { $lte: new Date() }, endDate: { $gte: new Date() } }).sort({ startDate: -1 }).limit(5).lean(),
      Category.find({ isActive: true }).sort({ order: 1 }).lean(),
      Product.find({ isActive: true }).sort({ createdAt: -1 }).limit(12).lean(),
      Product.find({ isActive: true, badge: 'bestseller' }).sort({ rating: -1 }).limit(12).lean(),
    ]);

    const now = new Date();
    const activeSales = flashSales
      .filter((s: any) => new Date(s.startDate) <= now && new Date(s.endDate) >= now)
      .map((s: any) => ({
        id: s._id,
        title: s.title,
        banner: s.banner,
        endDate: s.endDate,
        products: s.products,
      }));

    res.json({
      data: {
        categories,
        featuredProducts,
        flashSales: activeSales,
        newArrivals,
        bestsellers,
        heroBanners: [],
      },
    });
  } catch (err) { next(err); }
});

router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { Product } = await import('../models/Product');
    const { Category } = await import('../models/Category');

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const q = (req.query.q as string) || (req.query.query as string) || '';
    const category = req.query.category as string;
    const subcategory = req.query.subcategory as string;
    const brand = req.query.brand as string;
    const minPrice = parseFloat(req.query.minPrice as string);
    const maxPrice = parseFloat(req.query.maxPrice as string);
    const minRating = parseFloat(req.query.minRating as string);
    const inStock = req.query.inStock === 'true';
    const sortBy = (req.query.sort as string) || 'relevance';
    const vendorId = req.query.vendorId as string;
    const attributes = req.query.attributes as string;

    const filter: Record<string, unknown> = { isActive: true };

    if (q) {
      filter.$text = { $search: q };
    }
    if (category) {
      filter.category = category;
      const cat = await Category.findOne({ key: category }).lean();
      if (cat && (cat as any).subcategories?.includes(subcategory)) {
        filter.subcategory = subcategory;
      }
    }
    if (brand) filter.brand = brand;
    if (!isNaN(minPrice) || !isNaN(maxPrice)) {
      filter.price = {};
      if (!isNaN(minPrice)) (filter.price as any).$gte = minPrice;
      if (!isNaN(maxPrice)) (filter.price as any).$lte = maxPrice;
    }
    if (!isNaN(minRating)) {
      filter.rating = { $gte: minRating };
    }
    if (inStock) {
      filter.stock = { $gt: 0 };
    }
    if (vendorId) filter.vendorId = vendorId;
    if (attributes) {
      try {
        const parsed = JSON.parse(attributes);
        filter['variants'] = { $elemMatch: parsed };
      } catch {}
    }

    let sort: Record<string, unknown> = {};
    if (q) sort = { score: { $meta: 'textScore' } };
    else if (sortBy === 'price_asc') sort = { price: 1 };
    else if (sortBy === 'price_desc') sort = { price: -1 };
    else if (sortBy === 'newest') sort = { createdAt: -1 };
    else if (sortBy === 'rating') sort = { rating: -1 };
    else if (sortBy === 'reviews') sort = { reviews: -1 };
    else sort = { isFeatured: -1, rating: -1 };

    const projection = q ? { score: { $meta: 'textScore' } } : {};

    const [data, total] = await Promise.all([
      Product.find(filter, projection).sort(sort as any).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);

    const [brandsByFilter, categoriesByFilter] = await Promise.all([
      Product.distinct('brand', { ...filter, brand: { $exists: true, $ne: '' } }),
      Product.distinct('category', filter),
    ]);

    const priceRange = await Product.aggregate([
      { $match: filter as any },
      { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } },
    ]);

    res.json({
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      facets: {
        brands: brandsByFilter.filter(Boolean).sort() as string[],
        categories: categoriesByFilter.filter(Boolean).sort() as string[],
        priceRange: priceRange[0] ? { min: priceRange[0].min, max: priceRange[0].max } : { min: 0, max: 0 },
        totalResults: total,
      },
    });
  } catch (err) { next(err); }
});

router.get('/autocomplete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { Product } = await import('../models/Product');
    const q = (req.query.q as string) || '';
    if (!q || q.length < 2) return res.json({ data: [] });

    const suggestions = await Product.find(
      { $text: { $search: q }, isActive: true },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(8)
      .select('name brand category price image slug')
      .lean();

    res.json({ data: suggestions });
  } catch (err) { next(err); }
});

router.get('/suggestions', async (req: Request, res: Response) => {
  const q = (req.query.q as string) || '';
  if (!q || q.length < 2) return res.json({ data: [] });

  const { Product } = await import('../models/Product');
  const suggestions = await Product.aggregate([
    { $match: { $text: { $search: q }, isActive: true } },
    { $sort: { score: { $meta: 'textScore' } } as any },
    { $limit: 5 },
    { $project: { name: 1, brand: 1, category: 1, _id: 0 } },
  ]);

  const uniqueTerms = [...new Set(suggestions.map((s: any) => s.name).filter(Boolean))];
  res.json({ data: uniqueTerms.slice(0, 5) });
});

router.get('/categories', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { Category } = await import('../models/Category');
    const categories = await Category.find({ isActive: true }).sort({ order: 1 }).lean();
    res.json({ data: categories });
  } catch (err) { next(err); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { Product } = await import('../models/Product');
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ data: product });
  } catch (err) { next(err); }
});

export default router;
