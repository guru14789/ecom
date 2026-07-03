import { Router, Request, Response, NextFunction } from 'express';
import { listProducts, searchProducts } from '../../lib/firestore/products';
import { getActiveFlashSales } from '../../lib/firestore/flash-sales';
import { listCategories } from '../../lib/firestore/categories';

const router = Router();

// ─── Root: list / filter products ────────────────────────────────────────────
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const data = await listProducts({
      limit,
      category: req.query.category as string,
      vendorId: req.query.vendorId as string,
      isActive: true,
    });
    res.json({ data, pagination: { limit, total: data.length } });
  } catch (err) { next(err); }
});

router.get('/homepage', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [featuredProducts, flashSales, categories, newArrivals, bestsellers] = await Promise.all([
      listProducts({ isFeatured: true, isActive: true, limit: 12 }),
      getActiveFlashSales(),
      listCategories(true),
      listProducts({ isActive: true, limit: 12, sortBy: 'newest' }),
      // we don't have a bestseller badge indexed specifically, but we can list active
      listProducts({ isActive: true, limit: 12, sortBy: 'rating' }),
    ]);

    const activeSales = flashSales.map((s) => ({
      id: s.id,
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
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    
    const q = (req.query.q as string) || (req.query.query as string) || '';
    const category = req.query.category as string;
    const vendorId = req.query.vendorId as string;
    
    // In a real Firestore implementation without full-text search, we rely on searchProducts helper
    let data = [];
    if (q) {
      data = await searchProducts(q, limit);
    } else {
      data = await listProducts({
        category,
        vendorId,
        isActive: true,
        limit
      });
    }

    res.json({
      data,
      pagination: { page, limit, total: data.length, pages: 1 },
      facets: {
        brands: [],
        categories: [],
        priceRange: { min: 0, max: 0 },
        totalResults: data.length,
      },
    });
  } catch (err) { next(err); }
});

router.get('/autocomplete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = (req.query.q as string) || '';
    if (!q || q.length < 2) return res.json({ data: [] });

    const suggestions = await searchProducts(q, 8);

    res.json({ data: suggestions.map(s => ({
      name: s.name, brand: s.brand, category: s.category, price: s.price, image: s.image, slug: s.slug
    })) });
  } catch (err) { next(err); }
});

router.get('/suggestions', async (req: Request, res: Response) => {
  const q = (req.query.q as string) || '';
  if (!q || q.length < 2) return res.json({ data: [] });

  const suggestions = await searchProducts(q, 5);

  const uniqueTerms = [...new Set(suggestions.map((s) => s.name).filter(Boolean))];
  res.json({ data: uniqueTerms.slice(0, 5) });
});

router.get('/categories', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await listCategories(true);
    res.json({ data: categories });
  } catch (err) { next(err); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Need to use getProductById from controller as it uses getProductById from firestore
    const { getProductById } = await import('../../lib/firestore/products');
    const product = await getProductById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ data: product });
  } catch (err) { next(err); }
});

export default router;
