// Bu dosya, API isteklerinin temel yapılandırmasını, auth token ekleyen request interceptor
// ve 401 durumunda refresh token ile otomatik yenileme yapan response interceptor içerir.
import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '@/store/authStore';
import type { ApiResponse } from '@/types';

const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
});

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
}

type QueuedRequest = {
  resolve: (token: string) => void;
  reject: (reason: unknown) => void;
};

let isRefreshing = false;
let failedQueue: QueuedRequest[] = [];

const processQueue = (error: unknown, token: string | null = null): void => {
  failedQueue.forEach((queued) => {
    if (error) {
      queued.reject(error);
    } else if (token) {
      queued.resolve(token);
    }
  });
  failedQueue = [];
};

const refreshClient = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
});

const redirectToLogin = (): void => {
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url ?? '';
    if (
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    const storedRefreshToken = localStorage.getItem('refresh_token');
    if (!storedRefreshToken) {
      useAuthStore.getState().clearAuth();
      redirectToLogin();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        originalRequest._retry = true;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await refreshClient.post<
        ApiResponse<RefreshTokenResponse>
      >('/auth/refresh', { refreshToken: storedRefreshToken });

      const { accessToken, refreshToken: newRefreshToken } = data.data;

      localStorage.setItem('access_token', accessToken);
      if (newRefreshToken) {
        localStorage.setItem('refresh_token', newRefreshToken);
      }

      useAuthStore.setState({ accessToken, isAuthenticated: true });
      if (newRefreshToken) {
        useAuthStore.setState({ refreshToken: newRefreshToken });
      }

      processQueue(null, accessToken);

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      useAuthStore.getState().clearAuth();
      redirectToLogin();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
