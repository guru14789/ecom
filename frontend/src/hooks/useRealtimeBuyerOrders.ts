/**
 * useRealtimeBuyerOrders
 * 
 * Listens to Firestore in real-time for orders placed by this buyer.
 * When a vendor updates the order status (shipped, delivered, etc.) the
 * buyer's orders page updates immediately without any manual refresh.
 */
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface RealtimeBuyerOrder {
  id: string;
  status: string;
  paymentStatus: string;
  total: number;
  items: any[];
  deliveryAddress: any;
  createdAt: any;
  timeline?: any[];
  vendorOrders?: any[];
}

export function useRealtimeBuyerOrders(userId: string | null, maxOrders = 30) {
  const [orders, setOrders] = useState<RealtimeBuyerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(maxOrders)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: RealtimeBuyerOrder[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as RealtimeBuyerOrder));
        setOrders(data);
        setLoading(false);
      },
      (err) => {
        console.error('useRealtimeBuyerOrders error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, maxOrders]);

  return { orders, loading, error };
}
