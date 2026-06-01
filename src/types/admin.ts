// Bu dosya, admin panelinde kullanılan işletme, kullanıcı, kategori ve yorum tiplerini içerir.
import type { AppointmentStatus, BusinessStatus, UserRole } from '@/types';

/** Admin işletme listesi için işletme özeti */
export interface AdminBusiness {
  id: string;
  name: string;
  ownerName: string;
  phone?: string;
  email?: string;
  addressLine?: string;
  status: BusinessStatus;
  isActive: boolean;
  createdAt: string;
  rejectionReason?: string;
}

/** Admin kullanıcı */
export interface AdminUser {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

/** Admin kategori */
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  isActive: boolean;
  sortOrder: number;
}

/** Kategori oluşturma/güncelleme isteği */
export interface CategoryRequest {
  name: string;
  slug: string;
  description?: string;
  sortOrder?: number;
}

/** Admin yorum */
export interface AdminReview {
  id: string;
  businessId: string;
  businessName: string;
  userId: string;
  customerName: string;
  rating: number;
  comment?: string;
  isVisible: boolean;
  createdAt: string;
}

/** Admin kullanıcı detayında gösterilen randevu özeti */
export interface AdminUserAppointment {
  id: string;
  businessName: string;
  serviceName: string;
  startTime: string;
  status: AppointmentStatus;
  priceSnapshot: number;
  currency: string;
}
