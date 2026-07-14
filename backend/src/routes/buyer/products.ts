import { Router, Request, Response, NextFunction } from 'express';
import { listProducts, searchProducts } from '../../lib/firestore/products';
import { getActiveFlashSales } from '../../lib/firestore/flash-sales';
import { listCategories } from '../../lib/firestore/categories';

const router = Router();

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
    const [featuredProducts, flashSales, categories, newArrivals, bestsellers, heroProducts] = await Promise.all([
      listProducts({ isFeatured: true, isActive: true, limit: 12 }),
      getActiveFlashSales(),
      listCategories(true),
      listProducts({ isActive: true, limit: 12, sortBy: 'newest' }),
      listProducts({ isActive: true, limit: 12, sortBy: 'rating' }),
      listProducts({ isActive: true, isFeatured: true, limit: 5 }),
    ]);

    const heroBanners = heroProducts.map(p => ({
      id: p.id,
      name: p.name,
      image: p.image,
      slug: p.slug,
      price: p.price,
      mrp: p.mrp,
      badge: 'featured' as const,
    }));

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
        heroBanners,
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

    const allActive = await listProducts({ isActive: true, limit: 100 });
    const brands = [...new Set(allActive.map(p => p.brand).filter(Boolean))] as string[];
    const categories = [...new Set(allActive.map(p => p.category).filter(Boolean))] as string[];
    const prices = allActive.map(p => p.price);
    const priceRange = {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 0,
    };

    res.json({
      data,
      pagination: { page, limit, total: data.length, pages: Math.ceil(data.length / limit) || 1 },
      facets: { brands, categories, priceRange, totalResults: data.length },
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

router.get('/suggestions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = (req.query.q as string) || '';
    if (!q || q.length < 2) return res.json({ data: [] });

    const suggestions = await searchProducts(q, 5);

    const uniqueTerms = [...new Set(suggestions.map((s) => s.name).filter(Boolean))];
    res.json({ data: uniqueTerms.slice(0, 5) });
  } catch (err) { next(err); }
});

router.get('/categories', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await listCategories(true);
    res.json({ data: categories });
  } catch (err) { next(err); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { getProductById } = await import('../../lib/firestore/products');
    const product = await getProductById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ data: product });
  } catch (err) { next(err); }
});

router.get('/:id/related', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { getProductById, listProducts } = await import('../../lib/firestore/products');
    const product = await getProductById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    // Fetch products in the same category
    const related = await listProducts({
      category: product.category,
      isActive: true,
      limit: 5,
    });
    
    // Filter out the current product
    const filtered = related.filter(p => p.id !== product.id).slice(0, 4);
    
    res.json({ data: filtered });
  } catch (err) { next(err); }
});

export default router;
