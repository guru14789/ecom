import { db, fromDoc, fromQuery, now, increment } from './client';

export interface ProductVariant {
  id: string;
  label: string;
  type: 'size' | 'color' | 'storage' | 'pack';
  stock: number;
  priceModifier: number;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  slug: string;
  category: string;
  subcategory?: string;
  brand?: string;
  tags: string[];
  price: number;
  groupPrice: number;
  mrp?: number;
  targetCount: number;
  image: string;
  images: string[];
  specs: ProductSpec[];
  highlights: string[];
  variants: ProductVariant[];
  vendorId: string;
  stock: number;
  taxRate?: number;
  taxInclusive?: boolean;
  returnPolicy?: string;
  warranty?: string;
  deliveryTime?: string;
  rating: number;
  reviews: number;
  badge?: 'bestseller' | 'new' | 'trending' | 'limited' | 'deal';
  sponsored: boolean;
  productType?: 'physical' | 'digital';
  isSubscriptionEligible?: boolean;
  subscriptionDiscount?: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

const col = () => db.collection('products');

export async function getProductById(id: string): Promise<Product | null> {
  return fromDoc<Product>(await col().doc(id).get());
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const snap = await col().where('slug', '==', slug).limit(1).get();
  return snap.empty ? null : fromDoc<Product>(snap.docs[0]);
}

export async function createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
  const ref = col().doc();
  const payload = { ...data, createdAt: now(), updatedAt: now() };
  await ref.set(payload);
  return { id: ref.id, ...payload } as unknown as Product;
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  await col().doc(id).update({ ...data, updatedAt: now() });
}

export async function deleteProduct(id: string): Promise<void> {
  await col().doc(id).update({ isActive: false, updatedAt: now() });
}

export async function listProducts(opts: {
  vendorId?: string;
  category?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  limit?: number;
  startAfter?: string;
  sortBy?: string;
}): Promise<Product[]> {
  let q = col() as FirebaseFirestore.Query;
  if (opts.vendorId) q = q.where('vendorId', '==', opts.vendorId);
  if (opts.isActive !== undefined) q = q.where('isActive', '==', opts.isActive);
  if (opts.isFeatured !== undefined) q = q.where('isFeatured', '==', opts.isFeatured);

  const sortMap: Record<string, [string, 'asc' | 'desc']> = {
    price_asc: ['price', 'asc'],
    price_desc: ['price', 'desc'],
    rating: ['rating', 'desc'],
    newest: ['createdAt', 'desc'],
  };
  const [field, dir] = sortMap[opts.sortBy || 'newest'] || ['createdAt', 'desc'];
  
  // Only apply orderBy in Firestore if we aren't using where clauses that would require composite indexes
  const hasWhereClauses = opts.vendorId || opts.isActive !== undefined || opts.isFeatured !== undefined;
  if (!hasWhereClauses) {
    q = q.orderBy(field, dir);
  }

  // Optimize fetch size by limiting documents from Firestore directly
  const queryLimit = opts.limit || 50;
  const fetchLimit = hasWhereClauses ? Math.max(queryLimit * 2, 200) : 1000;
  
  const snapshot = await q.limit(fetchLimit).get();
  let products = fromQuery<Product>(snapshot);

  // Filter category in memory to handle slug variations flexibly
  if (opts.category) {
    const targetCat = opts.category.toLowerCase().trim();
    products = products.filter(p => {
      const prodCat = (p.category || '').toLowerCase().trim();
      const prodSub = (p.subcategory || '').toLowerCase().trim();
      
      if (targetCat === 'all') return true;
      if (targetCat === 'mobiles' && (prodCat === 'electronics' || prodSub.includes('mobile') || prodCat.includes('mobile'))) return true;
      if (targetCat === 'appliances' && (prodCat === 'home-kitchen' || prodCat.includes('appliance') || prodSub.includes('appliance'))) return true;
      if (targetCat === 'groceries' || targetCat === 'grocery' || targetCat === 'food') {
        return prodCat === 'groceries' || prodCat === 'grocery' || prodCat.includes('food') || prodSub.includes('food') || prodCat === 'food';
      }
      if (targetCat === 'home-kitchen' || targetCat === 'home') {
        return prodCat === 'home-kitchen' || prodCat === 'home' || prodCat.includes('kitchen') || prodSub.includes('home') || prodCat.includes('home');
      }
      return prodCat === targetCat || prodSub === targetCat || prodCat.includes(targetCat) || targetCat.includes(prodCat);
    });
  }

  // If we couldn't orderBy in Firestore, sort in memory
  if (hasWhereClauses) {
    products.sort((a: any, b: any) => {
      let aVal = a[field];
      let bVal = b[field];
      if (field === 'createdAt') {
        aVal = aVal?.toMillis ? aVal.toMillis() : 0;
        bVal = bVal?.toMillis ? bVal.toMillis() : 0;
      }
      if (dir === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });
  }

  if (opts.startAfter) {
    const startIdx = products.findIndex(p => p.id === opts.startAfter);
    if (startIdx !== -1) products = products.slice(startIdx + 1);
  }
  
  return products.slice(0, queryLimit);
}

export async function searchProducts(searchTerm: string, limit = 20): Promise<Product[]> {
  // Firestore doesn't have full-text search — use prefix match on name
  const end = searchTerm + '\uf8ff';
  const snap = await col()
    .where('isActive', '==', true)
    .where('name', '>=', searchTerm)
    .where('name', '<=', end)
    .limit(limit)
    .get();
  return fromQuery<Product>(snap);
}

export async function decrementStock(id: string, qty: number): Promise<void> {
  await col().doc(id).update({ stock: increment(-qty), updatedAt: now() });
}

export async function updateProductRating(id: string, newRating: number, reviewCount: number): Promise<void> {
  await col().doc(id).update({ rating: newRating, reviews: reviewCount, updatedAt: now() });
}
