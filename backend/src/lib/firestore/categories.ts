import { db, fromDoc, fromQuery, now } from './client';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: FirebaseFirestore.Timestamp;
}

const col = () => db.collection('categories');

export const getCategoryById = (id: string) => fromDoc<Category>(col().doc(id).get() as any);
export const listCategories = async (activeOnly = true) => {
  let q = col().orderBy('sortOrder') as FirebaseFirestore.Query;
  if (activeOnly) q = q.where('isActive', '==', true);
  return fromQuery<Category>(await q.get());
};
export const createCategory = async (data: Omit<Category, 'id' | 'createdAt'>) => {
  const ref = col().doc();
  await ref.set({ ...data, createdAt: now() });
  return { id: ref.id, ...data } as Category;
};
export const updateCategory = (id: string, data: Partial<Category>) => col().doc(id).update(data);
