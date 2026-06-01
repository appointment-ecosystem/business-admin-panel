// Bu dosya, API'dan gelen yanıtların tip tanımlarını içerir.

/** API'dan gelen genel başarılı yanıt formatı */
export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

/** API'dan gelen hata formatı */
export type ApiError = {
  success: false;
  message: string;
  errorType: string;
};

/** Kullanıcı rolleri */
export type UserRole = 'USER' | 'BUSINESS_OWNER' | 'BUSINESS_EMPLOYEE' | 'ADMIN';

/** Giriş yapmış kullanıcı tipi */
export interface AuthUser {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  role: UserRole;
  isActive?: boolean;
  phoneVerified?: boolean;
  profilePhotoUrl?: string;
}

/** İşletme durumları */
export type BusinessStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'PASSIVE';

/** Randevu durumları */
export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED_BY_USER'
  | 'CANCELLED_BY_BUSINESS'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'EXPIRED';
