// Bu dosya, işletme yorumlarını listelemek için kullanılan API isteklerini içerir.
import api from '@/api/axios';
import type { ApiResponse } from '@/types';
import type { Review } from '@/types/review';

export async function getBusinessReviews(
  businessId: string,
): Promise<ApiResponse<Review[]>> {
  return api.get<unknown, ApiResponse<Review[]>>(
    `/reviews/business/${businessId}`,
  );
}
