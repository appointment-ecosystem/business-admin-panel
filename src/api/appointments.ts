// Bu dosya, randevu durum güncelleme (onay, iptal, tamamlandı, no-show) API isteklerini içerir.
import api from '@/api/axios';
import type { ApiResponse } from '@/types';
import type { AppointmentSummary } from '@/types/business';

export async function confirmAppointment(
  id: string,
): Promise<ApiResponse<AppointmentSummary>> {
  return api.patch<unknown, ApiResponse<AppointmentSummary>>(
    `/appointments/${id}/confirm`,
  );
}

export async function cancelAppointmentByBusiness(
  id: string,
  reason?: string,
): Promise<ApiResponse<AppointmentSummary>> {
  return api.patch<unknown, ApiResponse<AppointmentSummary>>(
    `/appointments/${id}/cancel-by-business`,
    { reason },
  );
}

export async function completeAppointment(
  id: string,
): Promise<ApiResponse<AppointmentSummary>> {
  return api.patch<unknown, ApiResponse<AppointmentSummary>>(
    `/appointments/${id}/complete`,
  );
}

export async function markNoShow(
  id: string,
): Promise<ApiResponse<AppointmentSummary>> {
  return api.patch<unknown, ApiResponse<AppointmentSummary>>(
    `/appointments/${id}/no-show`,
  );
}
