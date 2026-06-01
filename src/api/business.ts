// Bu dosya, işletme (business) modülüne ait API isteklerini içerir.
import api from '@/api/axios';
import type { ApiResponse } from '@/types';
import type {
  AppointmentSummary,
  Business,
  BusinessDetail,
  BusinessPhoto,
  Service,
  ServiceRequest,
  UpdateBusinessRequest,
} from '@/types/business';

export interface GetBusinessAppointmentsParams {
  date?: string;
  status?: string;
}

export async function getMyBusiness(): Promise<Business> {
  const { data } = await api.get<ApiResponse<Business>>('/businesses/mine');
  return data.data;
}

export async function getBusinessById(id: string): Promise<BusinessDetail> {
  const { data } = await api.get<ApiResponse<BusinessDetail>>(`/businesses/${id}`);
  return data.data;
}

export async function updateBusiness(
  id: string,
  payload: UpdateBusinessRequest,
): Promise<BusinessDetail> {
  const { data } = await api.patch<ApiResponse<BusinessDetail>>(
    `/businesses/${id}`,
    payload,
  );
  return data.data;
}

export async function getBusinessPhotos(
  businessId: string,
): Promise<BusinessPhoto[]> {
  const { data } = await api.get<ApiResponse<BusinessPhoto[]>>(
    `/businesses/${businessId}/photos`,
  );
  return data.data;
}

export async function uploadBusinessPhoto(
  businessId: string,
  file: File,
): Promise<BusinessPhoto> {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post<ApiResponse<BusinessPhoto>>(
    `/businesses/${businessId}/photos`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return data.data;
}

export async function setCoverPhoto(
  businessId: string,
  photoId: string,
): Promise<BusinessPhoto> {
  const { data } = await api.patch<ApiResponse<BusinessPhoto>>(
    `/businesses/${businessId}/photos/${photoId}/cover`,
  );
  return data.data;
}

export async function deleteBusinessPhoto(
  businessId: string,
  photoId: string,
): Promise<void> {
  await api.delete(`/businesses/${businessId}/photos/${photoId}`);
}

export async function sortBusinessPhotos(
  businessId: string,
  photoIds: string[],
): Promise<void> {
  await api.patch(`/businesses/${businessId}/photos/sort`, { photoIds });
}

export async function getServices(businessId: string): Promise<Service[]> {
  const { data } = await api.get<ApiResponse<Service[]>>(
    `/businesses/${businessId}/services`,
  );
  return data.data;
}

export async function createService(
  businessId: string,
  payload: ServiceRequest,
): Promise<Service> {
  const { data } = await api.post<ApiResponse<Service>>(
    `/businesses/${businessId}/services`,
    payload,
  );
  return data.data;
}

export async function updateService(
  businessId: string,
  serviceId: string,
  payload: ServiceRequest,
): Promise<Service> {
  const { data } = await api.put<ApiResponse<Service>>(
    `/businesses/${businessId}/services/${serviceId}`,
    payload,
  );
  return data.data;
}

export async function deactivateService(
  businessId: string,
  serviceId: string,
): Promise<Service> {
  const { data } = await api.patch<ApiResponse<Service>>(
    `/businesses/${businessId}/services/${serviceId}/deactivate`,
  );
  return data.data;
}

export async function activateService(
  businessId: string,
  serviceId: string,
): Promise<Service> {
  const { data } = await api.patch<ApiResponse<Service>>(
    `/businesses/${businessId}/services/${serviceId}/activate`,
  );
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
