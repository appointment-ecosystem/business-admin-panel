// Bu dosya, admin panelinde yorum görünürlüğünün yönetildiği moderasyon sayfasını içerir.
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import {
  getAdminReviews,
  hideReview,
  showReview,
} from '@/api/admin';
import { extractArray } from '@/api/axios';
import type { AdminReview } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DataTable,
  EmptyState,
  formatDateTime,
  getErrorMessage,
  LoadingState,
  StatusBadge,
} from '@/pages/admin/adminUtils';

type ReviewVisibilityFilter = 'all' | 'visible' | 'hidden';

export default function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const [visibilityFilter, setVisibilityFilter] =
    useState<ReviewVisibilityFilter>('all');

  const reviewsQuery = useQuery({
    queryKey: ['adminReviews'],
    queryFn: getAdminReviews,
  });

  const invalidateReviews = () => {
    void queryClient.invalidateQueries({ queryKey: ['adminReviews'] });
  };

  const visibilityMutation = useMutation({
    mutationFn: (review: AdminReview) =>
      review.isVisible ? hideReview(review.id) : showReview(review.id),
    onSuccess: (response) => {
      toast.success(response.data.isVisible ? 'Yorum gösterildi' : 'Yorum gizlendi');
      invalidateReviews();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Yorum durumu güncellenemedi.'));
    },
  });

  const filteredReviews = useMemo(() => {
    const reviews = extractArray<AdminReview>(reviewsQuery.data?.data);
    if (visibilityFilter === 'visible') {
      return reviews.filter((review) => review.isVisible);
    }
    if (visibilityFilter === 'hidden') {
      return reviews.filter((review) => !review.isVisible);
    }
    return reviews;
  }, [reviewsQuery.data?.data, visibilityFilter]);

  const columns = useMemo<ColumnDef<AdminReview>[]>(
    () => [
      {
        accessorKey: 'businessName',
        header: 'İşletme',
        cell: ({ row }) => (
          <span className="font-medium">{row.original.businessName}</span>
        ),
      },
      {
        accessorKey: 'customerName',
        header: 'Müşteri',
      },
      {
        accessorKey: 'rating',
        header: 'Puan',
        cell: ({ row }) => `★ ${row.original.rating}`,
      },
      {
        accessorKey: 'comment',
        header: 'Yorum',
        cell: ({ row }) => (
          <span className="block max-w-md truncate">
            {row.original.comment || 'Yorum yazılmamış.'}
          </span>
        ),
      },
      {
        accessorKey: 'isVisible',
        header: 'Durum',
        cell: ({ row }) => (
          <StatusBadge tone={row.original.isVisible ? 'green' : 'gray'}>
            {row.original.isVisible ? 'Görünür' : 'Gizli'}
          </StatusBadge>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Tarih',
        cell: ({ row }) => formatDateTime(row.original.createdAt),
      },
      {
        id: 'actions',
        header: 'İşlemler',
        cell: ({ row }) => (
          <Button
            type="button"
            size="sm"
            variant={row.original.isVisible ? 'destructive' : 'outline'}
            className={
              row.original.isVisible
                ? undefined
                : 'border-green-300 bg-green-50 text-green-800 hover:bg-green-100'
            }
            disabled={visibilityMutation.isPending}
            onClick={() => visibilityMutation.mutate(row.original)}
          >
            {row.original.isVisible ? 'Gizle' : 'Göster'}
          </Button>
        ),
      },
    ],
    [visibilityMutation],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">
          Yorum Moderasyonu
        </h1>
        <Select
          value={visibilityFilter}
          onValueChange={(value) =>
            setVisibilityFilter(value as ReviewVisibilityFilter)
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

      {reviewsQuery.isLoading && <LoadingState label="Yorumlar yükleniyor..." />}

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
        filteredReviews.length === 0 && (
          <EmptyState message="Bu filtreye uygun yorum bulunamadı." />
        )}

      {!reviewsQuery.isLoading &&
        !reviewsQuery.isError &&
        filteredReviews.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <DataTable data={filteredReviews} columns={columns} />
            </CardContent>
          </Card>
        )}
    </div>
  );
}
