// Bu dosya, işletme hizmetlerinin listelendiği ve aktif/pasif yönetildiği sayfayı içerir.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import {
  activateService,
  deactivateService,
  getServices,
} from '@/api/business';
import { useMyBusiness } from '@/hooks/useMyBusiness';
import type { ApiError } from '@/types';
import type { Service } from '@/types/business';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined;
    if (data?.message) {
      return data.message;
    }
  }
  return fallback;
}

function formatDuration(minutes: number): string {
  return `${minutes} dk`;
}

function formatPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
    }).format(price);
  } catch {
    return `${price.toLocaleString('tr-TR')} ${currency}`;
  }
}

function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12">
      <div
        className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary"
        role="status"
        aria-label={label ?? 'Yükleniyor'}
      />
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  );
}

interface ServiceRowProps {
  service: Service;
  onToggleRequest: (service: Service) => void;
}

function ServiceRow({ service, onToggleRequest }: ServiceRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b px-4 py-4 last:border-b-0">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate font-semibold">{service.name}</p>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>Süre: {formatDuration(service.durationMin)}</span>
          <span>Fiyat: {formatPrice(service.price, service.currency)}</span>
          <span
            className={cn(
              'inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
              service.isActive
                ? 'bg-green-100 text-green-800 ring-green-200'
                : 'bg-gray-100 text-gray-700 ring-gray-200',
            )}
          >
            {service.isActive ? 'Aktif' : 'Pasif'}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link to={`/business/services/${service.id}`}>Düzenle</Link>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={cn(
            service.isActive
              ? 'border-yellow-300 bg-yellow-50 text-yellow-800 hover:bg-yellow-100'
              : 'border-green-300 bg-green-50 text-green-800 hover:bg-green-100',
          )}
          onClick={() => onToggleRequest(service)}
        >
          {service.isActive ? 'Pasifleştir' : 'Aktifleştir'}
        </Button>
      </div>
    </div>
  );
}

export default function BusinessServicesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { business, isLoading: isBusinessLoading, isError: isBusinessError, error: businessError } =
    useMyBusiness();

  const [toggleTarget, setToggleTarget] = useState<Service | null>(null);

  const servicesQuery = useQuery({
    queryKey: ['services', business?.id],
    queryFn: () => getServices(business!.id),
    enabled: Boolean(business?.id),
  });

  const invalidateServices = () => {
    if (business?.id) {
      void queryClient.invalidateQueries({
        queryKey: ['services', business.id],
      });
    }
  };

  const toggleMutation = useMutation({
    mutationFn: (service: Service) => {
      if (!business?.id) {
        throw new Error('İşletme bilgisi bulunamadı.');
      }
      if (service.isActive) {
        return deactivateService(business.id, service.id);
      }
      return activateService(business.id, service.id);
    },
    onSuccess: (updatedService) => {
      toast.success(
        updatedService.isActive
          ? 'Hizmet aktifleştirildi'
          : 'Hizmet pasifleştirildi',
      );
      setToggleTarget(null);
      invalidateServices();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'İşlem başarısız oldu.'));
    },
  });

  const services = servicesQuery.data ?? [];
  const isDeactivateAction = toggleTarget?.isActive ?? false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Hizmetler</h1>
        {business && (
          <Button onClick={() => navigate('/business/services/new')}>
            Yeni Hizmet Ekle
          </Button>
        )}
      </div>

      {isBusinessLoading && <LoadingSpinner label="İşletme bilgisi yükleniyor..." />}

      {isBusinessError && (
        <p className="text-sm text-destructive" role="alert">
          {getErrorMessage(
            businessError,
            'İşletme bilgisi yüklenirken bir hata oluştu.',
          )}
        </p>
      )}

      {business && !isBusinessLoading && (
        <Card>
          <CardContent className="p-0">
            {servicesQuery.isLoading && (
              <LoadingSpinner label="Hizmetler yükleniyor..." />
            )}

            {servicesQuery.isError && (
              <p className="p-6 text-sm text-destructive" role="alert">
                {getErrorMessage(
                  servicesQuery.error,
                  'Hizmetler yüklenirken bir hata oluştu.',
                )}
              </p>
            )}

            {!servicesQuery.isLoading && !servicesQuery.isError && services.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-4 py-12">
                <p className="text-sm text-muted-foreground">
                  Henüz hizmet eklenmemiş.
                </p>
                <Button onClick={() => navigate('/business/services/new')}>
                  İlk hizmetini ekle
                </Button>
              </div>
            )}

            {!servicesQuery.isLoading &&
              !servicesQuery.isError &&
              services.map((service) => (
                <ServiceRow
                  key={service.id}
                  service={service}
                  onToggleRequest={setToggleTarget}
                />
              ))}
          </CardContent>
        </Card>
      )}

      <AlertDialog
        open={toggleTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setToggleTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isDeactivateAction ? 'Hizmeti pasifleştir' : 'Hizmeti aktifleştir'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isDeactivateAction
                ? 'Bu hizmeti pasifleştirmek istediğinizden emin misiniz?'
                : 'Bu hizmeti aktifleştirmek istediğinizden emin misiniz?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              disabled={toggleMutation.isPending}
              onClick={() => {
                if (toggleTarget) {
                  toggleMutation.mutate(toggleTarget);
                }
              }}
            >
              Onayla
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
