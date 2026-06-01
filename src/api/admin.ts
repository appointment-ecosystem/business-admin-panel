// Bu dosya, admin panelindeki işletme, kullanıcı, yorum ve kategori API isteklerini içerir.
import api from '@/api/axios';
import type { ApiResponse, UserRole } from '@/types';
import type {
  AdminBusiness,
  AdminReview,
  AdminUser,
  AdminUserAppointment,
  Category,
  CategoryRequest,
} from '@/types/admin';

export interface GetAdminBusinessesParams {
  status?: string;
  page?: number;
}

export interface GetAdminUsersParams {
  page?: number;
}

export async function getAdminBusinesses(
  params?: GetAdminBusinessesParams,
): Promise<ApiResponse<AdminBusiness[]>> {
  return api.get<unknown, ApiResponse<AdminBusiness[]>>(
    '/admin/businesses',
    { params },
  );
}

export async function getAdminBusiness(id: string): Promise<ApiResponse<AdminBusiness>> {
  return api.get<unknown, ApiResponse<AdminBusiness>>(
    `/admin/businesses/${id}`,
  );
}

export async function approveBusiness(id: string): Promise<ApiResponse<AdminBusiness>> {
  return api.patch<unknown, ApiResponse<AdminBusiness>>(
    `/admin/businesses/${id}/approve`,
  );
}

export async function rejectBusiness(
  id: string,
  reason: string,
): Promise<ApiResponse<AdminBusiness>> {
  return api.patch<unknown, ApiResponse<AdminBusiness>>(
    `/admin/businesses/${id}/reject`,
    { reason },
  );
}

export async function suspendBusiness(id: string): Promise<ApiResponse<AdminBusiness>> {
  return api.patch<unknown, ApiResponse<AdminBusiness>>(
    `/admin/businesses/${id}/suspend`,
  );
}

export async function activateAdminBusiness(
  id: string,
): Promise<ApiResponse<AdminBusiness>> {
  return api.patch<unknown, ApiResponse<AdminBusiness>>(
    `/admin/businesses/${id}/activate`,
  );
}

export async function getAdminUsers(
  params?: GetAdminUsersParams,
): Promise<ApiResponse<AdminUser[]>> {
  return api.get<unknown, ApiResponse<AdminUser[]>>('/admin/users', {
    params,
  });
}

export async function getAdminUser(id: string): Promise<ApiResponse<AdminUser>> {
  return api.get<unknown, ApiResponse<AdminUser>>(`/admin/users/${id}`);
}

export async function getUserAppointments(
  id: string,
): Promise<ApiResponse<AdminUserAppointment[]>> {
  return api.get<unknown, ApiResponse<AdminUserAppointment[]>>(
    `/admin/users/${id}/appointments`,
  );
}

export async function updateUserRole(
  id: string,
  role: UserRole,
): Promise<ApiResponse<AdminUser>> {
  return api.patch<unknown, ApiResponse<AdminUser>>(
    `/admin/users/${id}/role`,
    { role },
  );
}

export async function deactivateUser(id: string): Promise<ApiResponse<AdminUser>> {
  return api.patch<unknown, ApiResponse<AdminUser>>(
    `/admin/users/${id}/deactivate`,
  );
}

export async function activateUser(id: string): Promise<ApiResponse<AdminUser>> {
  return api.patch<unknown, ApiResponse<AdminUser>>(
    `/admin/users/${id}/activate`,
  );
}

export async function getAdminReviews(): Promise<ApiResponse<AdminReview[]>> {
  return api.get<unknown, ApiResponse<AdminReview[]>>('/admin/reviews');
}

export async function hideReview(reviewId: string): Promise<ApiResponse<AdminReview>> {
  return api.patch<unknown, ApiResponse<AdminReview>>(
    `/admin/reviews/${reviewId}/hide`,
  );
}

export async function showReview(reviewId: string): Promise<ApiResponse<AdminReview>> {
  return api.patch<unknown, ApiResponse<AdminReview>>(
    `/admin/reviews/${reviewId}/show`,
  );
}

export async function getCategories(): Promise<ApiResponse<Category[]>> {
  return api.get<unknown, ApiResponse<Category[]>>('/admin/categories');
}

export async function createCategory(
  category: CategoryRequest,
): Promise<ApiResponse<Category>> {
  return api.post<unknown, ApiResponse<Category>>(
    '/admin/categories',
    category,
  );
}

export async function updateCategory(
  id: string,
  category: CategoryRequest,
): Promise<ApiResponse<Category>> {
  return api.put<unknown, ApiResponse<Category>>(
    `/admin/categories/${id}`,
    category,
  );
}

export async function deactivateCategory(id: string): Promise<ApiResponse<Category>> {
  return api.patch<unknown, ApiResponse<Category>>(
    `/admin/categories/${id}/deactivate`,
  );
}

export async function activateCategory(id: string): Promise<ApiResponse<Category>> {
  return api.patch<unknown, ApiResponse<Category>>(
    `/admin/categories/${id}/activate`,
  );
}
