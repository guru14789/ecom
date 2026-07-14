/**
 * useRealtimeVendorOrders
 * 
 * Listens to Firestore in real-time for orders containing this vendor's ID.
 * When a new order arrives or status changes, the component using this hook
 * re-renders immediately without polling.
 */
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface RealtimeOrder {
  id: string;
  status: string;
  paymentStatus: string;
  total: number;
  itemCount: number;
  createdAt: any;
  userId: string;
  vendorOrders?: any[];
  items?: any[];
}

export function useRealtimeVendorOrders(vendorId: string | null, maxOrders = 50) {
  const [orders, setOrders] = useState<RealtimeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vendorId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('vendorIds', 'array-contains', vendorId),
      orderBy('createdAt', 'desc'),
      limit(maxOrders)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: RealtimeOrder[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          itemCount: (doc.data().items || []).length,
        } as RealtimeOrder));
        setOrders(data);
        setLoading(false);
      },
      (err) => {
        console.error('useRealtimeVendorOrders error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [vendorId, maxOrders]);

  return { orders, loading, error };
}
