export interface User {
  uid: string;
  email?: string;
  phone: string;
  displayName?: string;
  photoURL?: string;
  role: 'buyer' | 'vendor' | 'admin';
  addresses: Address[];
  fcmToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id?: string;
  houseNo: string;
  area: string;
  pincode: string;
  landmark?: string;
  city: string;
  state: string;
  tag: 'home' | 'work' | 'other';
  lat?: number;
  lng?: number;
}

export interface Vendor {
  id: string;
  userId: string;
  storeName: string;
  storeSlug: string;
  logo: string;
  banner: string;
  description: string;
  category: string;
  tags: string[];
  address: {
    lat: number;
    lng: number;
    formatted: string;
    pincode: string;
  };
  deliveryRadiusKm: number;
  minOrderValue: number;
  avgDeliveryMins: number;
  isOpen: boolean;
  isApproved: boolean;
  isActive: boolean;
  rating: number;
  totalOrders: number;
  totalRevenue: number;
}

export interface Product {
  id: string;
  vendorId: string;
  name: string;
  slug: string;
  description: string;
  images: string[];
  category: string;
  subcategory?: string;
  brand?: string;
  specifications?: Record<string, string>;
  variants?: ProductVariant[];
  dimensions?: {
    length: number;
    width: number;
    height: number;
    weight: number; // in kg
  };
  tags: string[];
  price: number;
  mrp: number;
  discountPercent: number;
  unit: string;
  stock: number;
  isAvailable: boolean;
  isFeatured: boolean;
  rating: number;
  reviewCount: number;
}

export interface ProductVariant {
  id: string;
  name: string; // e.g., '64GB, Black'
  price: number;
  mrp: number;
  stock: number;
  images?: string[];
  sku?: string;
  attributes: Record<string, string>; // e.g., { Storage: '64GB', Color: 'Black' }
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: ProductVariant;
}

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  icon?: string; // Can be a lucide icon name or image URL
  subcategories?: CategoryNode[];
}
