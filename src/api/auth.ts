// Bu dosya, kimlik doğrulama (auth) ile ilgili API isteklerini içerir.
import api from '@/api/axios';
import type { ApiResponse, AuthUser } from '@/types';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
}

export async function login(
  phone: string,
  password: string,
): Promise<LoginResponse> {
  const { data } = await api.post<ApiResponse<LoginResponse>>('/auth/login', {
    phone,
    password,
  });
  return data.data;
}

export async function refreshToken(
  refreshTokenValue: string,
): Promise<RefreshTokenResponse> {
  const { data } = await api.post<ApiResponse<RefreshTokenResponse>>(
    '/auth/refresh',
    { refreshToken: refreshTokenValue },
  );
  return data.data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function getMe(): Promise<AuthUser> {
  const { data } = await api.get<ApiResponse<AuthUser>>('/auth/me');
  return data.data;
}
