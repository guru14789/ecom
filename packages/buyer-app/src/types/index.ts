// ============================================================
// ShopYNG — Complete Type Definitions
// ============================================================

// ─── Product & Catalog ───────────────────────────────────────

export interface ProductVariant {
  id: string;
  label: string; // e.g. "S", "M", "L", "Red", "64GB"
  type: 'size' | 'color' | 'storage' | 'pack';
  stock: number;
  priceModifier?: number; // +/- from base price
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductReview {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  body: string;
  images?: string[];
  helpful: number;
  notHelpful: number;
  createdAt: string;
  verified: boolean;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  category: string;
  brand?: string;
  price: number;
  groupPrice: number;
  mrp?: number; // Maximum Retail Price
  rating: number;
  reviews: number;
  image: string;
  images?: string[]; // Multiple product images
  sponsored?: boolean;
  joinedCount: number;
  targetCount: number;
  stock?: number;
  tags?: string[];
  sku?: string;
  vendorId?: string;
  vendorName?: string;
  variants?: ProductVariant[];
  specs?: ProductSpec[];
  highlights?: string[];
  returnPolicy?: string;
  warranty?: string;
  deliveryTime?: string;
  seller?: {
    id: string;
    name: string;
    rating: number;
  };
  badge?: 'bestseller' | 'new' | 'trending' | 'limited' | 'deal' | string;
  subcategory?: string;
}

export interface CategoryInfo {
  key: CategoryKey;
  label: string;
  image: string;
  subcategories: string[];
  featured?: boolean;
  color?: string;
}

export type CategoryKey =
  | 'all'
  | 'fruits'
  | 'fashion'
  | 'mobiles'
  | 'beauty'
  | 'electronics'
  | 'home'
  | 'food'
  | 'appliances'
  | '2wheeler'
  | 'auto'
  | 'sports'
  | 'books'
  | 'furniture'
  | 'toys'
  | 'live'
  | 'group';

// ─── Cart ───────────────────────────────────────────────────

export interface CartItem {
  product: Product;
  quantity: number;
  isGroupBuy: boolean;
  selectedVariant?: ProductVariant;
}

// ─── Address & Delivery ─────────────────────────────────────

export interface Address {
  id?: string;
  houseNo: string;
  area: string;
  pincode: string;
  landmark: string;
  city?: string;
  state?: string;
  tag: 'Home' | 'Office' | 'Other';
  isDefault?: boolean;
}

// ─── Order & Tracking ───────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'return_requested'
  | 'returned';

export interface OrderTimeline {
  status: OrderStatus;
  label: string;
  timestamp?: string;
  completed: boolean;
  active: boolean;
}

export interface Order {
  id: string;
  items: CartItem[];
  address: Address;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  couponDiscount?: number;
  handlingFee: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  date: string;
  estimatedDelivery?: string;
  trackingId?: string;
  invoiceUrl?: string;
  timeline?: OrderTimeline[];
}

// ─── Auth & User ────────────────────────────────────────────

export interface AuthUser {
  id?: string;
  phoneNumber: string;
  email?: string;
  fullName?: string;
  avatar?: string;
  isLoggedIn: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  firebaseUid?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  language: string;
  currency: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  theme: 'light' | 'dark' | 'system';
}

// ─── Wishlist ───────────────────────────────────────────────

export interface WishlistItem {
  product: Product;
  addedAt: string;
}

// ─── Notifications ──────────────────────────────────────────

export type NotificationType =
  | 'order_update'
  | 'group_deal'
  | 'price_drop'
  | 'back_in_stock'
  | 'promo'
  | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  imageUrl?: string;
}

// ─── Coupons & Promos ───────────────────────────────────────

export interface Coupon {
  code: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  minCartValue: number;
  maxDiscount?: number;
  validUntil: string;
  description?: string;
}

// ─── Banner / CMS ───────────────────────────────────────────

export interface Banner {
  id: string;
  imageUrl: string;
  mobileImageUrl?: string;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  bgColor?: string;
}

// ─── Flash Sale ─────────────────────────────────────────────

export interface FlashSale {
  id: string;
  title: string;
  endsAt: string; // ISO timestamp
  products: Product[];
  discountPercent: number;
}

// ─── Group Buy ──────────────────────────────────────────────

export interface GroupSession {
  id: string;
  product: Product;
  host: string;
  participants: string[];
  targetCount: number;
  currentCount: number;
  endsAt: string;
  status: 'active' | 'completed' | 'expired';
  shareCode: string;
}

// ─── Vendor ─────────────────────────────────────────────────

export interface Vendor {
  id: string;
  name: string;
  logo?: string;
  description?: string;
  rating: number;
  totalProducts: number;
  joinedAt: string;
  categories: string[];
  verified: boolean;
}

// ─── Reviews ────────────────────────────────────────────────

export interface ReviewSummary {
  average: number;
  total: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

// ─── Search ─────────────────────────────────────────────────

export interface SearchSuggestion {
  type: 'product' | 'category' | 'brand' | 'query';
  label: string;
  imageUrl?: string;
  url: string;
}

export interface SearchFilters {
  category?: string;
  brand?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popularity';
}

// ─── Review (API) ──────────────────────────────────────────────
export interface ReviewItem {
  _id: string;
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  body: string;
  images: Array<{ url: string; caption?: string }>;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
}

export interface ReviewsResponse {
  data: ReviewItem[];
  pagination: { page: number; limit: number; total: number; pages: number };
  ratingDistribution: Record<number, number>;
  averageRating: number;
}

// ─── Question & Answer ─────────────────────────────────────────
export interface Answer {
  _id: string;
  body: string;
  userId: string;
  userType: 'buyer' | 'vendor';
  isAccepted: boolean;
  helpfulCount: number;
  createdAt: string;
}

export interface Question {
  _id: string;
  productId: string;
  body: string;
  answers: Answer[];
  answerCount: number;
  createdAt: string;
}

// ─── Delivery Estimate ─────────────────────────────────────────
export interface DeliveryOption {
  type: 'standard' | 'express';
  label: string;
  charge: number;
  estimatedDays: string;
  estimatedDate: string;
}

export interface DeliveryEstimate {
  pincode: string;
  serviceable: boolean;
  options: DeliveryOption[];
}

// ─── Return Request ────────────────────────────────────────────
export type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'pickup_scheduled' | 'item_received' | 'refunded' | 'disputed';

export interface ReturnRequest {
  _id: string;
  orderId: string;
  productId: string;
  quantity: number;
  reason: string;
  detail?: string;
  images: string[];
  status: ReturnStatus;
  refundAmount: number;
  refundMethod: string;
  createdAt: string;
}

// ─── Dispute ───────────────────────────────────────────────────
export interface DisputeMessage {
  _id: string;
  userId: string;
  userRole: 'buyer' | 'vendor' | 'admin';
  message: string;
  attachments: string[];
  createdAt: string;
}

export interface Dispute {
  _id: string;
  returnRequestId?: string;
  orderId: string;
  raisedBy: string;
  reason: string;
  detail?: string;
  evidence: string[];
  messages: DisputeMessage[];
  status: string;
  resolution?: string;
  createdAt: string;
}

// ─── FlashSale (API) ───────────────────────────────────────────
export interface FlashSaleProduct {
  productId: string;
  salePrice: number;
  quantity: number;
  sold: number;
}

export interface FlashSaleItem {
  _id: string;
  title: string;
  description?: string;
  banner?: string;
  products: FlashSaleProduct[];
  startDate: string;
  endDate: string;
  isActive: boolean;
}
