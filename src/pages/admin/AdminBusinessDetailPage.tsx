// Bu dosya, admin panelinde tek bir işletmenin detayını ve onay durum aksiyonlarını içerir.
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  activateAdminBusiness,
  approveBusiness,
  getAdminBusiness,
  rejectBusiness,
  suspendBusiness,
} from '@/api/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  businessStatusLabel,
  businessStatusTone,
  EmptyState,
  formatDate,
  getErrorMessage,
  LoadingState,
  StatusBadge,
} from '@/pages/admin/adminUtils';

type BusinessAction = 'approve' | 'reject' | 'suspend' | 'activate';

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | undefined;
}) {
  return (
    <div className="grid gap-1 border-b py-3 last:border-b-0 md:grid-cols-[180px_1fr]">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-sm">{value || '-'}</span>
    </div>
  );
}

export default function AdminBusinessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const businessQuery = useQuery({
    queryKey: ['adminBusiness', id],
    queryFn: () => getAdminBusiness(id!),
    enabled: Boolean(id),
  });

  const invalidateBusiness = () => {
    void queryClient.invalidateQueries({ queryKey: ['adminBusiness', id] });
    void queryClient.invalidateQueries({ queryKey: ['adminBusinesses'] });
    void queryClient.invalidateQueries({ queryKey: ['adminBusinesses', 'pending'] });
  };

  const actionMutation = useMutation({
    mutationFn: (action: BusinessAction) => {
      if (!id) {
        throw new Error('İşletme kimliği bulunamadı.');
      }
      if (action === 'approve') {
        return approveBusiness(id);
      }
      if (action === 'suspend') {
        return suspendBusiness(id);
      }
      if (action === 'activate') {
        return activateAdminBusiness(id);
      }
      return rejectBusiness(id, rejectReason.trim());
    },
    onSuccess: () => {
      toast.success('İşletme durumu güncellendi');
      setIsRejectDialogOpen(false);
      setRejectReason('');
      invalidateBusiness();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'İşletme durumu güncellenemedi.'));
    },
  });

  const business = businessQuery.data?.data;

  if (!id) {
    return <EmptyState message="İşletme kimliği bulunamadı." />;
  }

  return (
    <div className="space-y-6">
      <Button variant="link" className="h-auto px-0" asChild>
        <Link to="/admin/businesses">← İşletmelere Dön</Link>
      </Button>

      {businessQuery.isLoading && (
        <LoadingState label="İşletme bilgisi yükleniyor..." />
      )}

      {businessQuery.isError && (
        <p className="text-sm text-destructive" role="alert">
          {getErrorMessage(
            businessQuery.error,
            'İşletme bilgisi yüklenirken bir hata oluştu.',
          )}
        </p>
      )}

      {business && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {business.name}
              </h1>
              <StatusBadge tone={businessStatusTone(business.status)}>
                {businessStatusLabel(business.status)}
              </StatusBadge>
            </div>

            <div className="flex flex-wrap gap-2">
              {business.status === 'PENDING' && (
                <>
                  <Button
                    type="button"
                    className="bg-green-600 text-white hover:bg-green-700"
                    disabled={actionMutation.isPending}
                    onClick={() => actionMutation.mutate('approve')}
                  >
                    Onayla
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={actionMutation.isPending}
                    onClick={() => setIsRejectDialogOpen(true)}
                  >
                    Reddet
                  </Button>
                </>
              )}

              {business.status === 'APPROVED' && (
                <Button
                  type="button"
                  className="bg-yellow-500 text-white hover:bg-yellow-600"
                  disabled={actionMutation.isPending}
                  onClick={() => actionMutation.mutate('suspend')}
                >
                  Askıya Al
                </Button>
              )}

              {(business.status === 'SUSPENDED' ||
                business.status === 'REJECTED') && (
                <Button
                  type="button"
                  className="bg-green-600 text-white hover:bg-green-700"
                  disabled={actionMutation.isPending}
                  onClick={() => actionMutation.mutate('activate')}
                >
                  Aktifleştir
                </Button>
              )}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>İşletme Bilgileri</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailRow label="Ad" value={business.name} />
              <DetailRow label="Sahip" value={business.ownerName} />
              <DetailRow label="Telefon" value={business.phone} />
              <DetailRow label="Email" value={business.email} />
              <DetailRow label="Adres" value={business.addressLine} />
              <DetailRow
                label="Durum"
                value={businessStatusLabel(business.status)}
              />
              <DetailRow
                label="Kayıt Tarihi"
                value={formatDate(business.createdAt)}
              />
              {business.rejectionReason && (
                <DetailRow
                  label="Red Nedeni"
                  value={business.rejectionReason}
                />
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>İşletmeyi Reddet</DialogTitle>
            <DialogDescription>
              Red nedeni zorunludur ve işletme kaydında saklanır.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            placeholder="Red nedeni"
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
            >
              İptal
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={actionMutation.isPending || rejectReason.trim().length === 0}
              onClick={() => actionMutation.mutate('reject')}
            >
              Reddet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
