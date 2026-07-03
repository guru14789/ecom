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
  returnPolicy?: string;
  warranty?: string;
  deliveryTime?: string;
  rating: number;
  reviews: number;
  badge?: 'bestseller' | 'new' | 'trending' | 'limited' | 'deal';
  sponsored: boolean;
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
  if (opts.category) q = q.where('category', '==', opts.category);
  if (opts.isActive !== undefined) q = q.where('isActive', '==', opts.isActive);
  if (opts.isFeatured !== undefined) q = q.where('isFeatured', '==', opts.isFeatured);

  const sortMap: Record<string, [string, 'asc' | 'desc']> = {
    price_asc: ['price', 'asc'],
    price_desc: ['price', 'desc'],
    rating: ['rating', 'desc'],
    newest: ['createdAt', 'desc'],
  };
  const [field, dir] = sortMap[opts.sortBy || 'newest'] || ['createdAt', 'desc'];
  q = q.orderBy(field, dir);

  if (opts.startAfter) {
    const cursor = await col().doc(opts.startAfter).get();
    q = q.startAfter(cursor);
  }
  return fromQuery<Product>(await q.limit(opts.limit || 20).get());
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
