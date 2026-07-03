import { db, now } from './client';

export interface CartItem {
  productId: string;
  quantity: number;
  isGroupBuy: boolean;
  variantId?: string;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  updatedAt: FirebaseFirestore.Timestamp;
}

const col = () => db.collection('cart');

export async function getCart(userId: string): Promise<Cart> {
  const snap = await col().doc(userId).get();
  if (!snap.exists) return { userId, items: [], updatedAt: now() as FirebaseFirestore.Timestamp };
  return { userId, ...snap.data() } as Cart;
}

export async function setCart(userId: string, items: CartItem[]): Promise<void> {
  await col().doc(userId).set({ userId, items, updatedAt: now() }, { merge: false });
}

export async function addToCart(userId: string, item: CartItem): Promise<Cart> {
  const cart = await getCart(userId);
  const existing = cart.items.findIndex(
    (i) => i.productId === item.productId && i.variantId === item.variantId
  );
  if (existing >= 0) {
    cart.items[existing].quantity += item.quantity;
  } else {
    cart.items.push(item);
  }
  await setCart(userId, cart.items);
  return { ...cart, items: cart.items };
}

export async function updateCartItem(
  userId: string,
  productId: string,
  quantity: number,
  variantId?: string
): Promise<Cart> {
  const cart = await getCart(userId);
  if (quantity <= 0) {
    cart.items = cart.items.filter(
      (i) => !(i.productId === productId && i.variantId === variantId)
    );
  } else {
    const idx = cart.items.findIndex(
      (i) => i.productId === productId && i.variantId === variantId
    );
    if (idx >= 0) cart.items[idx].quantity = quantity;
  }
  await setCart(userId, cart.items);
  return cart;
}

export async function clearCart(userId: string): Promise<void> {
  await col().doc(userId).delete();
}
