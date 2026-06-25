// Bu dosya, işletme (business) modülüne ait API isteklerini içerir.
import api from '@/api/axios';
import type { ApiResponse } from '@/types';
import type {
  AppointmentSummary,
  AssignServicesRequest,
  Business,
  BusinessDetail,
  BusinessPhoto,
  Holiday,
  HolidayRequest,
  Service,
  ServiceRequest,
  Staff,
  StaffRequest,
  UpdateBusinessRequest,
  WorkingHour,
  WorkingHourRequest,
} from '@/types/business';

export interface GetBusinessAppointmentsParams {
  rangeStart: string;
  rangeEnd: string;
  status?: string;
}

export async function getMyBusiness(): Promise<ApiResponse<Business>> {
  return api.get<unknown, ApiResponse<Business>>('/businesses/mine');
}

export async function getBusinessById(id: string): Promise<ApiResponse<BusinessDetail>> {
  return api.get<unknown, ApiResponse<BusinessDetail>>(`/businesses/${id}`);
}

export async function updateBusiness(
  id: string,
  payload: UpdateBusinessRequest,
): Promise<ApiResponse<BusinessDetail>> {
  return api.patch<unknown, ApiResponse<BusinessDetail>>(
    `/businesses/${id}`,
    payload,
  );
}

export async function getBusinessPhotos(
  businessId: string,
): Promise<ApiResponse<BusinessPhoto[]>> {
  return api.get<unknown, ApiResponse<BusinessPhoto[]>>(
    `/businesses/${businessId}/photos`,
  );
}

export async function uploadBusinessPhoto(
  businessId: string,
  file: File,
): Promise<ApiResponse<BusinessPhoto>> {
  const formData = new FormData();
  formData.append('file', file);

  return api.post<unknown, ApiResponse<BusinessPhoto>>(
    `/businesses/${businessId}/photos`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
}

export async function setCoverPhoto(
  businessId: string,
  photoId: string,
): Promise<ApiResponse<BusinessPhoto>> {
  return api.patch<unknown, ApiResponse<BusinessPhoto>>(
    `/businesses/${businessId}/photos/${photoId}/cover`,
  );
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

export async function getServices(businessId: string): Promise<ApiResponse<Service[]>> {
  return api.get<unknown, ApiResponse<Service[]>>(
    `/businesses/${businessId}/services`,
  );
}

export async function createService(
  businessId: string,
  payload: ServiceRequest,
): Promise<ApiResponse<Service>> {
  return api.post<unknown, ApiResponse<Service>>(
    `/businesses/${businessId}/services`,
    payload,
  );
}

export async function updateService(
  businessId: string,
  serviceId: string,
  payload: ServiceRequest,
): Promise<ApiResponse<Service>> {
  return api.put<unknown, ApiResponse<Service>>(
    `/businesses/${businessId}/services/${serviceId}`,
    payload,
  );
}

export async function deactivateService(
  businessId: string,
  serviceId: string,
): Promise<ApiResponse<Service>> {
  return api.patch<unknown, ApiResponse<Service>>(
    `/businesses/${businessId}/services/${serviceId}/deactivate`,
  );
}

export async function activateService(
  businessId: string,
  serviceId: string,
): Promise<ApiResponse<Service>> {
  return api.patch<unknown, ApiResponse<Service>>(
    `/businesses/${businessId}/services/${serviceId}/activate`,
  );
}

export async function getStaff(businessId: string): Promise<ApiResponse<Staff[]>> {
  return api.get<unknown, ApiResponse<Staff[]>>(
    `/businesses/${businessId}/staff`,
  );
}

export async function createStaff(
  businessId: string,
  payload: StaffRequest,
): Promise<ApiResponse<Staff>> {
  return api.post<unknown, ApiResponse<Staff>>(
    `/businesses/${businessId}/staff`,
    payload,
  );
}

export async function updateStaff(
  businessId: string,
  staffId: string,
  payload: StaffRequest,
): Promise<ApiResponse<Staff>> {
  return api.put<unknown, ApiResponse<Staff>>(
    `/businesses/${businessId}/staff/${staffId}`,
    payload,
  );
}

export async function assignStaffServices(
  businessId: string,
  staffId: string,
  payload: AssignServicesRequest,
): Promise<void> {
  await api.post(
    `/businesses/${businessId}/staff/${staffId}/services`,
    payload,
  );
}

export async function removeStaffServices(
  businessId: string,
  staffId: string,
  payload: AssignServicesRequest,
): Promise<void> {
  await api.patch(
    `/businesses/${businessId}/staff/${staffId}/services/remove`,
    payload,
  );
}

export async function deactivateStaff(
  businessId: string,
  staffId: string,
): Promise<ApiResponse<Staff>> {
  return api.patch<unknown, ApiResponse<Staff>>(
    `/businesses/${businessId}/staff/${staffId}/deactivate`,
  );
}

export async function activateStaff(
  businessId: string,
  staffId: string,
): Promise<ApiResponse<Staff>> {
  return api.patch<unknown, ApiResponse<Staff>>(
    `/businesses/${businessId}/staff/${staffId}/activate`,
  );
}

export async function getWorkingHours(
  businessId: string,
): Promise<ApiResponse<WorkingHour[]>> {
  return api.get<unknown, ApiResponse<WorkingHour[]>>(
    `/businesses/${businessId}/working-hours`,
  );
}

export async function updateWorkingHours(
  businessId: string,
  payload: WorkingHourRequest[],
): Promise<ApiResponse<WorkingHour[]>> {
  return api.put<unknown, ApiResponse<WorkingHour[]>>(
    `/businesses/${businessId}/working-hours`,
    payload,
  );
}

export async function getHolidays(businessId: string): Promise<ApiResponse<Holiday[]>> {
  return api.get<unknown, ApiResponse<Holiday[]>>(
    `/businesses/${businessId}/holidays`,
  );
}

export async function createHoliday(
  businessId: string,
  payload: HolidayRequest,
): Promise<ApiResponse<Holiday>> {
  return api.post<unknown, ApiResponse<Holiday>>(
    `/businesses/${businessId}/holidays`,
    payload,
  );
}

export async function deleteHoliday(
  businessId: string,
  holidayId: string,
): Promise<void> {
  await api.delete(`/businesses/${businessId}/holidays/${holidayId}`);
}

export async function getBusinessAppointments(
  businessId: string,
  params?: GetBusinessAppointmentsParams,
): Promise<ApiResponse<AppointmentSummary[]>> {
  return api.get<unknown, ApiResponse<AppointmentSummary[]>>(
    `/appointments/business/${businessId}`,
    { params },
  );
}
