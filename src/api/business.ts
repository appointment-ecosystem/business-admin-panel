// Bu dosya, işletme (business) modülüne ait API isteklerini içerir.
import api from '@/api/axios';
import type { ApiResponse } from '@/types';
import type { AppointmentSummary, Business } from '@/types/business';

export interface GetBusinessAppointmentsParams {
  date?: string;
  status?: string;
}

export async function getMyBusiness(): Promise<Business> {
  const { data } = await api.get<ApiResponse<Business>>('/businesses/mine');
  return data.data;
}

export async function getBusinessAppointments(
  businessId: string,
  params?: GetBusinessAppointmentsParams,
): Promise<AppointmentSummary[]> {
  const { data } = await api.get<ApiResponse<AppointmentSummary[]>>(
    `/appointments/business/${businessId}`,
    { params },
  );
  return data.data;
}
