// Bu dosya, TanStack Query ile giriş yapmış kullanıcının işletme bilgisini çeken custom hook'u içerir.
import { useQuery } from '@tanstack/react-query';
import { getMyBusiness } from '@/api/business';
const STALE_TIME_MS = 5 * 60 * 1000;

export function useMyBusiness() {
  const query = useQuery({
    queryKey: ['myBusiness'],
    queryFn: getMyBusiness,
    staleTime: STALE_TIME_MS,
  });

  return {
    business: query.data?.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
