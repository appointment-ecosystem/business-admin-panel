// Bu dosya, işletme (business) modülüne ait TypeScript tip tanımlarını; profil, fotoğraf, hizmet, personel, çalışma saati ve tatil tiplerini içerir.

/** İşletme durumu */
export type BusinessStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'PASSIVE';

/** İşletme özet bilgisi (dashboard için) */
export interface Business {
  id: string;
  name: string;
  status: BusinessStatus;
  phone: string;
  email?: string;
  description?: string;
  address_line?: string;
  isActive: boolean;
  createdAt: string;
}

/** Randevu durumu */
export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED_BY_USER'
  | 'CANCELLED_BY_BUSINESS'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'EXPIRED';

/** İşletme detay bilgisi (profil düzenleme için) */
export interface BusinessDetail {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  addressLine?: string;
  latitude?: number;
  longitude?: number;
  status: BusinessStatus;
  isActive: boolean;
  cityId?: string;
  districtId?: string;
  neighborhoodId?: string;
  createdAt: string;
}

/** İşletme profil güncelleme isteği */
export interface UpdateBusinessRequest {
  name?: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  addressLine?: string;
}

/** İşletme fotoğrafı */
export interface BusinessPhoto {
  id: string;
  url: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  isCover: boolean;
  sortOrder: number;
  createdAt: string;
}

/** Hizmet */
export interface Service {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  durationMin: number;
  price: number;
  currency: string;
  imageUrl?: string;
  isActive: boolean;
  sortOrder: number;
}

/** Hizmet oluşturma/güncelleme isteği */
export interface ServiceRequest {
  name: string;
  description?: string;
  durationMin: number;
  price: number;
  currency?: string;
}

/** Personel */
export interface Staff {
  id: string;
  businessId: string;
  userId?: string;
  fullName: string;
  title?: string;
  bio?: string;
  profilePhotoUrl?: string;
  isActive: boolean;
  sortOrder: number;
  services?: Service[];
}

/** Personel oluşturma/güncelleme isteği */
export interface StaffRequest {
  fullName: string;
  title?: string;
  bio?: string;
}

/** Personele hizmet atama isteği */
export interface AssignServicesRequest {
  serviceIds: string[];
}

/** Çalışma saati */
export interface WorkingHour {
  id: string;
  businessId: string;
  staffId?: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

/** Çalışma saati güncelleme isteği */
export interface WorkingHourRequest {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

/** Tatil günü */
export interface Holiday {
  id: string;
  businessId: string;
  staffId?: string;
  date: string;
  reason?: string;
}

/** Tatil günü oluşturma isteği */
export interface HolidayRequest {
  date: string;
  reason?: string;
  staffId?: string;
}

/** Dashboard için randevu özeti */
export interface AppointmentSummary {
  id: string;
  customerName: string;
  customerPhone?: string; // Backend'den userPhone olarak gelir
  serviceName: string;
  staffName?: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  priceSnapshot: number;
  currency: string;
  notes?: string;
  cancellationReason?: string;
}
