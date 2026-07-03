import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, doc, getDocs, getDoc, query, where, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Product } from '../types';

const PRODUCTS_COLLECTION = 'products';

export const useProducts = (vendorId?: string, category?: string) => {
  return useQuery({
    queryKey: ['products', { vendorId, category }],
    queryFn: async () => {
      let q = collection(db, PRODUCTS_COLLECTION) as any;
      
      const constraints = [];
      if (vendorId) constraints.push(where('vendorId', '==', vendorId));
      if (category) constraints.push(where('category', '==', category));
      
      if (constraints.length > 0) {
        q = query(q, ...constraints);
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    }
  });
};

export const useProduct = (productId: string) => {
  return useQuery({
    queryKey: ['products', productId],
    queryFn: async () => {
      if (!productId) return null;
      const docRef = doc(db, PRODUCTS_COLLECTION, productId);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) throw new Error('Product not found');
      return { id: snapshot.id, ...snapshot.data() } as Product;
    },
    enabled: !!productId
  });
};

export const useAddProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (productData: Omit<Product, 'id'>) => {
      const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), productData);
      return { id: docRef.id, ...productData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Product> & { id: string }) => {
      const docRef = doc(db, PRODUCTS_COLLECTION, id);
      await updateDoc(docRef, data);
      return { id, ...data };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', variables.id] });
    }
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });
};
