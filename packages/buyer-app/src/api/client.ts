import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getAuth } from 'firebase/auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user && config.headers) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // No user signed in — send request without auth
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
          const token = await user.getIdToken(true);
          error.config.headers.Authorization = `Bearer ${token}`;
          return api(error.config);
        }
      } catch {
        // Force re-login
      }
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    statusCode: number;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const stringToNumberMap = new Map<string, number>();
const numberToStringMap = new Map<number, string>();
let nextNumericId = 100000;

export function getNumericId(stringId: string | undefined | null): number {
  if (!stringId) return 0;
  if (!isNaN(Number(stringId))) return Number(stringId);
  const existing = stringToNumberMap.get(stringId);
  if (existing !== undefined) return existing;
  const numId = nextNumericId++;
  stringToNumberMap.set(stringId, numId);
  numberToStringMap.set(numId, stringId);
  return numId;
}

export function getStringId(numId: number | string): string {
  if (typeof numId === 'string') return numId;
  const existing = numberToStringMap.get(numId);
  return existing || String(numId);
}
