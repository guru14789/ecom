import { api } from './client';

export interface SendOtpParams {
  phoneNumber: string;
}

export interface VerifyOtpParams {
  phoneNumber: string;
  otp: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    phoneNumber: string;
    fullName: string | null;
    email: string | null;
    avatar: string | null;
    isPhoneVerified: boolean;
    role: string;
  };
}

export async function sendOtp(params: SendOtpParams) {
  const response = await api.post('/auth/send-otp', params);
  return response.data;
}

export async function verifyOtp(params: VerifyOtpParams): Promise<AuthResponse> {
  const response = await api.post('/auth/verify-otp', params);
  return response.data;
}

export async function refreshAccessToken(token: string) {
  const response = await api.post('/auth/refresh', {
    refreshToken: token,
  });
  return response.data;
}

export async function logout() {
  try {
    await api.post('/auth/logout');
  } catch {
  }
}
