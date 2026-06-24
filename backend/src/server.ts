import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import app from './app';
import { env } from './config/env';

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: env.CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Auth token required'));

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as {
      sub: string; role: string; vendorId?: string;
    };
    (socket as any).user = payload;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const user = (socket as any).user as { sub: string; role: string; vendorId?: string };
  console.log(`Socket connected: ${socket.id} (user: ${user.sub})`);

  socket.join(`user:${user.sub}`);
  if (user.vendorId) socket.join(`vendor:${user.vendorId}`);

  socket.on('order:subscribe', ({ orderId }: { orderId: string }) => {
    socket.join(`order:${orderId}`);
  });

  socket.on('order:unsubscribe', ({ orderId }: { orderId: string }) => {
    socket.leave(`order:${orderId}`);
  });

  socket.on('product:subscribe', ({ productId }: { productId: string }) => {
    socket.join(`product:${productId}`);
  });

  socket.on('product:unsubscribe', ({ productId }: { productId: string }) => {
    socket.leave(`product:${productId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

export function getIO(): Server {
  return io;
}

export function emitToUser(userId: string, event: string, data: Record<string, unknown>) {
  io.to(`user:${userId}`).emit(event, data);
}

export function emitToVendor(vendorId: string, event: string, data: Record<string, unknown>) {
  io.to(`vendor:${vendorId}`).emit(event, data);
}

export function emitToProduct(productId: string, event: string, data: Record<string, unknown>) {
  io.to(`product:${productId}`).emit(event, data);
}

export function emitToOrder(orderId: string, event: string, data: Record<string, unknown>) {
  io.to(`order:${orderId}`).emit(event, data);
}

httpServer.listen(env.PORT, () => {
  console.log(`API Server running on port ${env.PORT}`);
});
