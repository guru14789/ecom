import { api, PaginatedResponse, getNumericId } from './client';
import { Product, CategoryInfo } from '../types';

export interface ProductFilters {
  page?: number;
  limit?: number;
  category?: string;
  categories?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: string;
  q?: string;
  inStock?: boolean;
  brand?: string;
  brands?: string[];
  minDiscount?: number;
}

export interface Facets {
  brands: string[];
  categories: Array<{ key: string; count: number }>;
  priceRange: { minPrice: number; maxPrice: number };
}

export interface ProductsResponse extends PaginatedResponse<Product> {
  facets?: Facets;
}

export interface AutocompleteItem {
  _id: string;
  name: string;
  slug?: string;
  price: number;
  mrp?: number;
  image: string;
  brand?: string;
  category: string;
  inStock: boolean;
}

export interface SearchSuggestions {
  popular: string[];
  categories: Array<{ key: string; label: string }>;
}

export function mapProduct(p: any): Product {
  if (!p) return p;
  return {
    ...p,
    id: getNumericId(p._id),
    joinedCount: p.joinedCount || 0,
    targetCount: p.targetCount || 10,
    sponsored: p.sponsored || false,
    image: p.image || 'fruits_and_veg.webp',
  };
}

export async function getProducts(filters: ProductFilters = {}): Promise<ProductsResponse> {
  const params: Record<string, string> = {};
  if (filters.page) params.page = String(filters.page);
  if (filters.limit) params.limit = String(filters.limit);
  if (filters.category && filters.category !== 'all') params.category = filters.category;
  if (filters.categories && filters.categories.length > 0) params.categories = filters.categories.join(',');
  if (filters.minPrice !== undefined) params.minPrice = String(filters.minPrice);
  if (filters.maxPrice !== undefined) params.maxPrice = String(filters.maxPrice);
  if (filters.minRating !== undefined) params.minRating = String(filters.minRating);
  if (filters.sort) params.sort = filters.sort;
  if (filters.q) params.q = filters.q;
  if (filters.inStock) params.inStock = 'true';
  if (filters.brand) params.brand = filters.brand;
  if (filters.brands && filters.brands.length > 0) params.brands = filters.brands.join(',');
  if (filters.minDiscount !== undefined) params.minDiscount = String(filters.minDiscount);

  const response = await api.get('/products', { params });
  return {
    ...response.data,
    data: (response.data.data || []).map(mapProduct),
  };
}

export async function getProductById(id: string): Promise<{ data: Product }> {
  const response = await api.get(`/products/${id}`);
  return {
    ...response.data,
    data: mapProduct(response.data.data),
  };
}

export async function searchProducts(q: string, filters: ProductFilters = {}): Promise<ProductsResponse> {
  const params: Record<string, string> = { q };
  if (filters.page) params.page = String(filters.page);
  if (filters.limit) params.limit = String(filters.limit);
  if (filters.categories && filters.categories.length > 0) params.categories = filters.categories.join(',');
  if (filters.minPrice !== undefined) params.minPrice = String(filters.minPrice);
  if (filters.maxPrice !== undefined) params.maxPrice = String(filters.maxPrice);
  if (filters.minRating !== undefined) params.minRating = String(filters.minRating);
  if (filters.sort) params.sort = filters.sort;
  if (filters.inStock) params.inStock = 'true';
  if (filters.brands && filters.brands.length > 0) params.brands = filters.brands.join(',');
  if (filters.minDiscount !== undefined) params.minDiscount = String(filters.minDiscount);

  const response = await api.get('/products/search', { params });
  return {
    ...response.data,
    data: (response.data.data || []).map(mapProduct),
  };
}

export async function autocompleteSearch(q: string): Promise<{ data: AutocompleteItem[] }> {
  const response = await api.get('/products/autocomplete', { params: { q, limit: '8' } });
  return response.data;
}

export async function getSearchSuggestions(): Promise<{ data: SearchSuggestions }> {
  const response = await api.get('/products/suggestions');
  return response.data;
}

export async function getCategories(): Promise<{ data: CategoryInfo[] }> {
  const response = await api.get('/products/categories');
  return response.data;
}

export async function getFeaturedProducts(): Promise<{ data: Product[] }> {
  const response = await api.get('/products', {
    params: { limit: '20', sort: 'rating' },
  });
  return {
    ...response.data,
    data: (response.data.data || []).map(mapProduct),
  };
}
