// Bu dosya, işletme (business) modülüne ait TypeScript tip tanımlarını içerir.

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

/** Dashboard için randevu özeti */
export interface AppointmentSummary {
  id: string;
  customerName: string;
  serviceName: string;
  staffName?: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  priceSnapshot: number;
  currency: string;
}
