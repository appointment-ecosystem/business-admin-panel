// Bu dosya, işletmeye ait yorum verisinin TypeScript tip tanımını içerir.

/** İşletmeye ait yorum */
export interface Review {
  id: string;
  appointmentId: string;
  userId: string;
  businessId: string;
  customerName: string;
  rating: number;
  comment?: string;
  isVisible: boolean;
  createdAt: string;
}
