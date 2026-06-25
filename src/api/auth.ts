// Bu dosya, kimlik doğrulama (auth) ile ilgili API isteklerini içerir.
import api from '@/api/axios';
import type { ApiResponse, AuthUser } from '@/types';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  userId: string;
  role: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
}

/**
 * Kullanıcı girişi.
 * @param email  - @ içeriyorsa dolu gelir, telefon ile girişte boş string.
 * @param phone  - @ içermiyorsa dolu gelir, email ile girişte boş string.
 * @param password - Kullanıcı şifresi.
 */
export async function login(
  email: string,
  phone: string,
  password: string,
): Promise<ApiResponse<LoginResponse>> {
  return api.post<unknown, ApiResponse<LoginResponse>>('/auth/login', {
    email,
    phone,
    password,
  });
}

export async function refreshToken(
  refreshTokenValue: string,
): Promise<ApiResponse<RefreshTokenResponse>> {
  return api.post<unknown, ApiResponse<RefreshTokenResponse>>(
    '/auth/refresh',
    { refreshToken: refreshTokenValue },
  );
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function getMe(): Promise<ApiResponse<AuthUser>> {
  return api.get<unknown, ApiResponse<AuthUser>>('/auth/me');
}
