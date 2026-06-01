// Bu dosya, admin panelinin özet metriklerini ve ilgili yönetim sayfası bağlantılarını içerir.
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  getAdminBusinesses,
  getAdminReviews,
  getAdminUsers,
} from '@/api/admin';
import { extractArray } from '@/api/axios';
import type { AdminBusiness, AdminReview, AdminUser } from '@/types/admin';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  getErrorMessage,
  LoadingState,
} from '@/pages/admin/adminUtils';

function SummaryCard({
  title,
  value,
  to,
}: {
  title: string;
  value: number;
  to: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        <Button variant="outline" size="sm" asChild>
          <Link to={to}>Tümünü Gör</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const pendingBusinessesQuery = useQuery({
    queryKey: ['adminBusinesses', 'pending'],
    queryFn: () => getAdminBusinesses({ status: 'PENDING' }),
  });
  const usersQuery = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => getAdminUsers(),
  });
  const reviewsQuery = useQuery({
    queryKey: ['adminReviews'],
    queryFn: getAdminReviews,
  });

  const isLoading =
    pendingBusinessesQuery.isLoading ||
    usersQuery.isLoading ||
    reviewsQuery.isLoading;
  const error =
    pendingBusinessesQuery.error ?? usersQuery.error ?? reviewsQuery.error;

  const pendingBusinesses = extractArray<AdminBusiness>(
    pendingBusinessesQuery.data?.data,
  );
  const users = extractArray<AdminUser>(usersQuery.data?.data);
  const reviews = extractArray<AdminReview>(reviewsQuery.data?.data);
  const hiddenReviewCount = reviews.filter((review) => !review.isVisible).length;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>

      {isLoading && <LoadingState label="Dashboard verileri yükleniyor..." />}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {getErrorMessage(error, 'Dashboard verileri yüklenirken hata oluştu.')}
        </p>
      )}

      {!isLoading && !error && (
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            title="Bekleyen Onay"
            value={pendingBusinesses.length}
            to="/admin/businesses"
          />
          <SummaryCard
            title="Toplam Kullanıcı"
            value={users.length}
            to="/admin/users"
          />
          <SummaryCard
            title="Gizli Yorum"
            value={hiddenReviewCount}
            to="/admin/reviews"
          />
        </div>
      )}
    </div>
  );
}
