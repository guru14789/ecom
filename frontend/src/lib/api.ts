/**
 * Centralized API client that automatically attaches the Firebase ID token
 * to every request. All vendor/admin frontend pages should use this instead
 * of calling Firestore directly.
 */
import { auth } from './firebase';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) {
    console.warn('api.ts: auth.currentUser is null. Is Firebase Auth initialized?');
    return null;
  }
  try {
    const token = await user.getIdToken();
    return token;
  } catch (err) {
    console.error('api.ts: Failed to get ID token:', err);
    return null;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  requireAuth?: boolean;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params, requireAuth = true } = opts;

  // Build URL with query params
  const url = new URL(`${BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== '') url.searchParams.set(key, String(val));
    });
  }

  // Build headers
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (requireAuth) {
    const token = await getIdToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let errorData: any = {};
    try { errorData = await response.json(); } catch { /* ignore */ }
    let msg = errorData?.error?.message || errorData?.message || `HTTP ${response.status}`;
    
    if (errorData?.error?.code === 'VALIDATION_ERROR' && Array.isArray(errorData.error.details)) {
      const issues = errorData.error.details.map((d: any) => d.message).join(', ');
      if (issues) {
        msg = `${msg}: ${issues}`;
      }
    }

    if (response.status === 401) {
      console.warn('api.ts: 401 Unauthorized detected. Token expired or invalid.');
      auth.signOut().catch(() => {});
      if (window.location.pathname !== '/profile') {
        window.location.href = '/profile?session_expired=true';
      }
    }

    throw new ApiError(
      response.status,
      errorData?.error?.code || 'UNKNOWN_ERROR',
      msg
    );
  }

  return response.json() as Promise<T>;
}

// ─── Convenience methods ───────────────────────────────────────────────────────
export const api = {
  get: <T>(endpoint: string, params?: RequestOptions['params'], requireAuth = true) =>
    request<T>(endpoint, { method: 'GET', params, requireAuth }),

  post: <T>(endpoint: string, body?: unknown, requireAuth = true) =>
    request<T>(endpoint, { method: 'POST', body, requireAuth }),

  put: <T>(endpoint: string, body?: unknown, requireAuth = true) =>
    request<T>(endpoint, { method: 'PUT', body, requireAuth }),

  patch: <T>(endpoint: string, body?: unknown, requireAuth = true) =>
    request<T>(endpoint, { method: 'PATCH', body, requireAuth }),

  delete: <T>(endpoint: string, requireAuth = true) =>
    request<T>(endpoint, { method: 'DELETE', requireAuth }),
};

// ─── Public API helpers ────────────────────────────────────────────────────────
export const publicApi = {
  checkPincode: (pincode: string) => api.get(`/public/shipping/check-pincode?pincode=${pincode}`).then((r: any) => r.data),
  jobs: {
    list: () => api.get<any>('/api/public/jobs', undefined, false),
  },
};

// ─── Buyer API helpers ─────────────────────────────────────────────────────────
export const buyerApi = {
  homepage: () => api.get<any>('/api/products/homepage', undefined, false),
  products: {
    list: (params?: object) => api.get<any>('/api/products', params as any, false),
    get: (id: string) => api.get<any>(`/api/products/${id}`, undefined, false),
    search: (params?: object) => api.get<any>('/api/products/search', params as any, false),
    categories: () => api.get<any>('/api/products/categories', undefined, false),
  },
  orders: {
    list: () => api.get<any>('/api/orders', undefined, true),
    get: (id: string) => api.get<any>(`/api/orders/${id}`, undefined, true),
    track: (id: string) => api.get<any>(`/api/orders/${id}/tracking`, undefined, true),
    cancel: (id: string, reason: string) => api.post<any>(`/api/orders/${id}/cancel`, { reason }),
    return: (id: string, reason: string) => api.post<any>(`/api/orders/${id}/return`, { reason }),
  },
  payments: {
    createOrder: (data: { addressId?: string; couponCode?: string }) => api.post<any>('/api/payments/create-order', data),
    verify: (data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; order_id: string }) => api.post<any>('/api/payments/verify', data),
  },
  cart: {
    sync: (items: any[]) => api.post<any>('/api/cart/sync', { items }),
  }
};

// ─── Vendor API helpers ────────────────────────────────────────────────────────
export const vendorApi = {
  // Registration (public — still passes token when available)
  register: {
    initiate: (data: object) => api.post('/api/public/vendor/register/initiate', data),
    updateBusiness: (vendorId: string, data: object) => api.put(`/api/public/vendor/register/${vendorId}/business`, data),
    updateStore: (vendorId: string, data: object) => api.put(`/api/public/vendor/register/${vendorId}/store`, data),
    updateAddresses: (vendorId: string, data: object) => api.put(`/api/public/vendor/register/${vendorId}/addresses`, data),
    updateBank: (vendorId: string, data: object) => api.put(`/api/public/vendor/register/${vendorId}/bank`, data),
    verifyGst: (data: object) => api.post(`/api/public/vendor/register/verify/gst`, data),
    verifyPan: (data: object) => api.post(`/api/public/vendor/register/verify/pan`, data),
    verifyBank: (vendorId: string) => api.post(`/api/public/vendor/register/${vendorId}/verify/bank`, {}),
    submit: (vendorId: string, data: object) => api.post(`/api/public/vendor/register/${vendorId}/submit`, data),
    status: () => api.get('/api/public/vendor/register/status'),
  },
  // Dashboard
  dashboard: () => api.get<any>('/api/vendor/dashboard'),
  // Products
  products: {
    list: (params?: object) => api.get<any>('/api/vendor/products', params as any),
    get: (id: string) => api.get<any>(`/api/vendor/products/${id}`),
    create: (data: object) => api.post<any>('/api/vendor/products', data),
    update: (id: string, data: object) => api.put<any>(`/api/vendor/products/${id}`, data),
    delete: (id: string) => api.delete<any>(`/api/vendor/products/${id}`),
    getUploadUrl: (data: object) => api.post<any>('/api/vendor/products/upload-url', data),
  },
  // Orders
  orders: {
    list: (params?: object) => api.get<any>('/api/vendor/orders', params as any),
    get: (id: string) => api.get<any>(`/api/vendor/orders/${id}`),
    updateStatus: (id: string, data: object) => api.put<any>(`/api/vendor/orders/${id}/status`, data),
    getInvoice: (id: string) => api.get<any>(`/api/vendor/orders/${id}/invoice`),
  },
  // Settings
  settings: {
    get: () => api.get<any>('/api/vendor/settings'),
    update: (data: object) => api.put<any>('/api/vendor/settings', data),
  },
  // Analytics
  analytics: (params?: object) => api.get<any>('/api/vendor/analytics', params as any),
  // Returns
  returns: {
    list: () => api.get<any>('/api/vendor/returns'),
    approve: (id: string, refundAmount?: number) => api.put<any>(`/api/vendor/returns/${id}/approve`, { refundAmount }),
    reject: (id: string, reason: string) => api.put<any>(`/api/vendor/returns/${id}/reject`, { reason }),
  },
  // Payouts
  payouts: {
    list: () => api.get<any>('/api/vendor/payouts'),
    bankDetails: () => api.get<any>('/api/vendor/payouts/bank-details'),
  },
  // Notifications
  notifications: {
    list: (params?: object) => api.get<any>('/api/vendor/notifications', params as any),
    markRead: (id: string) => api.put<any>(`/api/vendor/notifications/${id}/read`),
    markAllRead: () => api.put<any>('/api/vendor/notifications/read-all'),
  },
  // KYC
  kyc: {
    status: () => api.get<any>('/api/vendor/kyc-status'),
    submit: (data: object) => api.post<any>('/api/vendor/kyc/submit', data),
  },
  // CRM
  crm: {
    customers: () => api.get<any>('/api/vendor/crm/customers'),
  },
  // Reviews (real data — from vendor products' reviews)
  reviews: {
    list: (params?: object) => api.get<any>('/api/vendor/reviews', params as any),
    reply: (id: string, reply: string) => api.post<any>(`/api/vendor/reviews/${id}/reply`, { reply }),
  },
  // Ad Campaigns (real data — persisted in Firestore)
  campaigns: {
    list: () => api.get<any>('/api/vendor/campaigns'),
    create: (data: { name: string; budget: number }) => api.post<any>('/api/vendor/campaigns', data),
    update: (id: string, data: object) => api.put<any>(`/api/vendor/campaigns/${id}`, data),
    delete: (id: string) => api.delete<any>(`/api/vendor/campaigns/${id}`),
  },
  // Shipping Config (real data — persisted in vendor document)
  shippingConfig: {
    get: () => api.get<any>('/api/vendor/shipping-config'),
    save: (data: object) => api.put<any>('/api/vendor/shipping-config', data),
  },
};

// ─── Chat API helpers ────────────────────────────────────────────────────────
export const chatApi = {
  buyer: {
    initiate: (vendorId: string) => api.post<any>('/api/chat/initiate', { vendorId }),
    list: () => api.get<any>('/api/chat'),
    sendMessage: (chatId: string, text: string) => api.post<any>(`/api/chat/${chatId}/messages`, { text }),
    markRead: (chatId: string) => api.put<any>(`/api/chat/${chatId}/read`),
  },
  vendor: {
    list: () => api.get<any>('/api/vendor/chat'),
    sendMessage: (chatId: string, text: string) => api.post<any>(`/api/vendor/chat/${chatId}/messages`, { text }),
    markRead: (chatId: string) => api.put<any>(`/api/vendor/chat/${chatId}/read`),
  }
};

// ─── Admin API helpers ────────────────────────────────────────────────────────
export const adminApi = {
  vendors: {
    list: () => api.get<any>('/api/admin/vendors'),
    get: (id: string) => api.get<any>(`/api/admin/vendors/${id}`),
    approve: (id: string) => api.put<any>(`/api/admin/vendors/${id}/approve`),
    reject: (id: string, reason: string) => api.put<any>(`/api/admin/vendors/${id}/reject`, { reason }),
    toggleStatus: (id: string, isActive: boolean) => api.put<any>(`/api/admin/vendors/${id}/status`, { isActive }),
  },
  products: {
    list: () => api.get<any>('/api/admin/products'),
    update: (id: string, data: object) => api.put<any>(`/api/admin/products/${id}`, data),
    delete: (id: string) => api.delete<any>(`/api/admin/products/${id}`),
  },
  users: {
    list: () => api.get<any>('/api/admin/users'),
    toggleActive: (id: string, isActive: boolean) => api.put<any>(`/api/admin/users/${id}/toggle-active`, { isActive }),
  },
  orders: {
    list: (params?: object) => api.get<any>('/api/admin/orders', params as any),
    get: (id: string) => api.get<any>(`/api/admin/orders/${id}`),
    updateStatus: (id: string, status: string) => api.put<any>(`/api/admin/orders/${id}/status`, { status }),
    releasePayment: (id: string) => api.put<any>(`/api/admin/orders/${id}/release-payment`),
    refund: (id: string) => api.put<any>(`/api/admin/orders/${id}/refund`),
  },
  auditLog: {
    list: (params?: object) => api.get<any>('/api/admin/activity-log', params as any),
  },
  jobs: {
    list: () => api.get<any>('/api/admin/jobs'),
    create: (data: object) => api.post<any>('/api/admin/jobs', data),
    update: (id: string, data: object) => api.put<any>(`/api/admin/jobs/${id}`, data),
    delete: (id: string) => api.delete<any>(`/api/admin/jobs/${id}`),
  },
};

