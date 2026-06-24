import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socketInstance: Socket | null = null;

export function getSocket(): Socket | null {
  return socketInstance;
}

type SocketEvent =
  | 'order:created'
  | 'order:status_changed'
  | 'order:cancelled'
  | 'order:updated'
  | 'escrow:released'
  | 'product:updated';

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  on: (event: SocketEvent, handler: (...args: any[]) => void) => () => void;
  subscribeProduct: (productId: string, onUpdate: (data: any) => void) => () => void;
}

export function useSocket(token?: string | null): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<Map<string, Set<(...args: any[]) => void>>>(new Map());

  useEffect(() => {
    if (!token) {
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
      }
      return;
    }

    if (socketInstance?.connected) {
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    socketRef.current = socket;
    socketInstance = socket;

    return () => {
    };
  }, [token]);

  const on = useCallback((event: SocketEvent, handler: (...args: any[]) => void): (() => void) => {
    const socket = socketRef.current || socketInstance;
    if (!socket) {
      const cleanup = () => {};
      return cleanup;
    }

    socket.on(event, handler);

    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(handler);

    return () => {
      socket.off(event, handler);
      listenersRef.current.get(event)?.delete(handler);
    };
  }, []);

  const productListenerRef = useRef<((data: any) => void) | null>(null);

  const subscribeProduct = useCallback((productId: string, onUpdate: (data: any) => void) => {
    const socket = socketRef.current || socketInstance;
    if (!socket) return () => {};

    socket.emit('product:subscribe', { productId });

    if (productListenerRef.current) {
      socket.off('product:updated', productListenerRef.current);
    }

    productListenerRef.current = onUpdate;
    socket.on('product:updated', onUpdate);

    return () => {
      socket.emit('product:unsubscribe', { productId });
      socket.off('product:updated', onUpdate);
      productListenerRef.current = null;
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected ?? false,
    on,
    subscribeProduct,
  };
}
