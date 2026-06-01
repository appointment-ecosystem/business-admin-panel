// Bu dosya, API isteklerinin temel yapılandırmasını ve auth token ekleyen bir interceptor içerir.
// Base URL: http://localhost:8080/api/v1
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
});

// İstek interceptor: Authorization header ekler.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

export default api;
