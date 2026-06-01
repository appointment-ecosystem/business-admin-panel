// Bu dosya, işletmeye ait yorumların listelendiği ve istemci tarafında filtrelendiği sayfayı içerir.
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Star } from 'lucide-react';
import { extractArray } from '@/api/axios';
import { getBusinessReviews } from '@/api/reviews';
import { useMyBusiness } from '@/hooks/useMyBusiness';
import type { ApiError } from '@/types';
import type { Review } from '@/types/review';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const REVIEWS_STALE_TIME_MS = 2 * 60 * 1000;
const STAR_VALUES = [1, 2, 3, 4, 5] as const;

type RatingFilter = 'all' | '5' | '4' | '3' | '2' | '1';
type VisibilityFilter = 'all' | 'visible' | 'hidden';

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined;
    if (data?.message) {
      return data.message;
    }
  }
  return fallback;
}

function formatReviewDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function LoadingSpinner({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12">
      <div
        className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary"
        role="status"
        aria-label={label}
      />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${rating} yıldız`}>
      {STAR_VALUES.map((star) => (
        <Star
          key={star}
          className={cn(
            'h-5 w-5',
            star <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-muted-foreground/40',
          )}
        />
      ))}
    </div>
  );
}

function VisibilityBadge({ isVisible }: { isVisible: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
        isVisible
          ? 'bg-green-100 text-green-800 ring-green-200'
          : 'bg-gray-100 text-gray-700 ring-gray-200',
      )}
    >
      {isVisible ? 'Görünür' : 'Gizli'}
    </span>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <Card>
      <CardContent className="space-y-4 pt-1">
        <div className="flex items-start justify-between gap-4">
          <p className="min-w-0 truncate text-base font-semibold">
            {review.customerName}
          </p>
          <time
            className="shrink-0 text-sm text-muted-foreground"
            dateTime={review.createdAt}
          >
            {formatReviewDate(review.createdAt)}
          </time>
        </div>

        <RatingStars rating={review.rating} />

        {review.comment ? (
          <p className="text-sm leading-6 text-foreground">{review.comment}</p>
        ) : (
          <p className="text-sm italic text-muted-foreground">
            Yorum yazılmamış.
          </p>
        )}

        <div className="flex items-center">
          <VisibilityBadge isVisible={review.isVisible} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function BusinessReviewsPage() {
  const {
    business,
    isLoading: isBusinessLoading,
    isError: isBusinessError,
    error: businessError,
  } = useMyBusiness();

  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
  const [visibilityFilter, setVisibilityFilter] =
    useState<VisibilityFilter>('all');

  const reviewsQuery = useQuery({
    queryKey: ['businessReviews', business?.id],
    queryFn: () => getBusinessReviews(business!.id),
    enabled: Boolean(business?.id),
    staleTime: REVIEWS_STALE_TIME_MS,
  });

  const reviews = useMemo(() => {
    return extractArray<Review>(reviewsQuery.data?.data).sort(
      (first, second) =>
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime(),
    );
  }, [reviewsQuery.data?.data]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const matchesRating =
        ratingFilter === 'all' || review.rating === Number(ratingFilter);
      const matchesVisibility =
        visibilityFilter === 'all' ||
        (visibilityFilter === 'visible' && review.isVisible) ||
        (visibilityFilter === 'hidden' && !review.isVisible);

      return matchesRating && matchesVisibility;
    });
  }, [ratingFilter, reviews, visibilityFilter]);

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((total, review) => total + review.rating, 0) /
        reviews.length
      : 0;
  const visibleReviewCount = reviews.filter((review) => review.isVisible).length;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Yorumlar</h1>

      {isBusinessLoading && (
        <LoadingSpinner label="İşletme bilgisi yükleniyor..." />
      )}

      {isBusinessError && (
        <p className="text-sm text-destructive" role="alert">
          {getErrorMessage(
            businessError,
            'İşletme bilgisi yüklenirken bir hata oluştu.',
          )}
        </p>
      )}

      {business && !isBusinessLoading && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <SummaryCard title="Toplam Yorum" value={reviews.length} />
            <SummaryCard
              title="Ortalama Puan"
              value={`${averageRating.toFixed(1)} / 5`}
            />
            <SummaryCard title="Görünür Yorum" value={visibleReviewCount} />
          </div>

          <Card>
            <CardContent className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Puan</p>
                <Select
                  value={ratingFilter}
                  onValueChange={(value) =>
                    setRatingFilter(value as RatingFilter)
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Puan seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="5">5 yıldız</SelectItem>
                    <SelectItem value="4">4 yıldız</SelectItem>
                    <SelectItem value="3">3 yıldız</SelectItem>
                    <SelectItem value="2">2 yıldız</SelectItem>
                    <SelectItem value="1">1 yıldız</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Durum</p>
                <Select
                  value={visibilityFilter}
                  onValueChange={(value) =>
                    setVisibilityFilter(value as VisibilityFilter)
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Durum seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="visible">Görünür</SelectItem>
                    <SelectItem value="hidden">Gizli</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {reviewsQuery.isLoading && (
              <LoadingSpinner label="Yorumlar yükleniyor..." />
            )}

            {reviewsQuery.isError && (
              <p className="text-sm text-destructive" role="alert">
                {getErrorMessage(
                  reviewsQuery.error,
                  'Yorumlar yüklenirken bir hata oluştu.',
                )}
              </p>
            )}

            {!reviewsQuery.isLoading &&
              !reviewsQuery.isError &&
              reviews.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center text-sm text-muted-foreground">
                    Henüz yorum yapılmamış.
                  </CardContent>
                </Card>
              )}

            {!reviewsQuery.isLoading &&
              !reviewsQuery.isError &&
              reviews.length > 0 &&
              filteredReviews.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center text-sm text-muted-foreground">
                    Bu filtreye uygun yorum bulunamadı.
                  </CardContent>
                </Card>
              )}

            {!reviewsQuery.isLoading &&
              !reviewsQuery.isError &&
              filteredReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
          </div>
        </>
      )}
    </div>
  );
}
