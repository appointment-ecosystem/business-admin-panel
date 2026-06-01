// Bu dosya, yeni hizmet ekleme ve mevcut hizmet düzenleme formunu içerir.
import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import {
  createService,
  getServices,
  updateService,
} from '@/api/business';
import { useMyBusiness } from '@/hooks/useMyBusiness';
import type { ApiError } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const serviceSchema = z.object({
  name: z
    .string()
    .min(1, 'Hizmet adı zorunludur')
    .min(2, 'Hizmet adı en az 2 karakter olmalıdır'),
  description: z.string().optional(),
  durationMin: z.coerce
    .number()
    .min(5, 'Süre en az 5 dakika olmalıdır')
    .max(480, 'Süre en fazla 480 dakika olabilir'),
  price: z.coerce.number().min(0, 'Fiyat 0 veya daha büyük olmalıdır'),
  currency: z.string().optional(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined;
    if (data?.message) {
      return data.message;
    }
  }
  return fallback;
}

function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <div
        className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary"
        role="status"
        aria-label={label ?? 'Yükleniyor'}
      />
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  );
}

export default function BusinessServiceFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id: serviceId } = useParams<{ id: string }>();
  const isEditMode = Boolean(serviceId);

  const { business, isLoading: isBusinessLoading } = useMyBusiness();

  const servicesQuery = useQuery({
    queryKey: ['services', business?.id],
    queryFn: () => getServices(business!.id),
    enabled: Boolean(business?.id && isEditMode),
  });

  const existingService = useMemo(() => {
    if (!isEditMode || !serviceId || !servicesQuery.data) {
      return null;
    }
    return servicesQuery.data.find((service) => service.id === serviceId) ?? null;
  }, [isEditMode, serviceId, servicesQuery.data]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      description: '',
      durationMin: 30,
      price: 0,
      currency: 'TRY',
    },
  });

  useEffect(() => {
    if (!isEditMode) {
      reset({
        name: '',
        description: '',
        durationMin: 30,
        price: 0,
        currency: 'TRY',
      });
      return;
    }

    if (existingService) {
      reset({
        name: existingService.name,
        description: existingService.description ?? '',
        durationMin: existingService.durationMin,
        price: existingService.price,
        currency: existingService.currency || 'TRY',
      });
    }
  }, [isEditMode, existingService, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: ServiceFormValues) => {
      if (!business?.id) {
        throw new Error('İşletme bilgisi bulunamadı.');
      }

      const payload = {
        name: values.name,
        description: values.description || undefined,
        durationMin: values.durationMin,
        price: values.price,
        currency: values.currency || 'TRY',
      };

      if (isEditMode && serviceId) {
        return updateService(business.id, serviceId, payload);
      }

      return createService(business.id, payload);
    },
    onSuccess: () => {
      toast.success(isEditMode ? 'Hizmet güncellendi' : 'Hizmet oluşturuldu');
      if (business?.id) {
        void queryClient.invalidateQueries({
          queryKey: ['services', business.id],
        });
      }
      navigate('/business/services');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Kayıt işlemi başarısız oldu.'));
    },
  });

  const onSubmit = (values: ServiceFormValues) => {
    saveMutation.mutate(values);
  };

  const isSaving = isSubmitting || saveMutation.isPending;
  const isFormLoading =
    isBusinessLoading || (isEditMode && servicesQuery.isLoading);

  const showNotFound =
    isEditMode &&
    !servicesQuery.isLoading &&
    !servicesQuery.isError &&
    servicesQuery.data &&
    !existingService;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        to="/business/services"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Hizmetlere Dön
      </Link>

      <h1 className="text-3xl font-bold tracking-tight">
        {isEditMode ? 'Hizmeti Düzenle' : 'Yeni Hizmet'}
      </h1>

      {isFormLoading && <LoadingSpinner label="Form yükleniyor..." />}

      {showNotFound && (
        <p className="text-sm text-destructive" role="alert">
          Hizmet bulunamadı.
        </p>
      )}

      {servicesQuery.isError && isEditMode && (
        <p className="text-sm text-destructive" role="alert">
          {getErrorMessage(
            servicesQuery.error,
            'Hizmet bilgisi yüklenirken bir hata oluştu.',
          )}
        </p>
      )}

      {business && !isFormLoading && !showNotFound && (
        <Card>
          <CardHeader>
            <CardTitle>{isEditMode ? 'Hizmet Bilgileri' : 'Yeni Hizmet'}</CardTitle>
            <CardDescription>
              Hizmet adı, süre ve fiyat bilgilerini girin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Hizmet Adı</Label>
                <Input
                  id="name"
                  aria-invalid={Boolean(errors.name)}
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  rows={4}
                  {...register('description')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="durationMin">Süre (dakika)</Label>
                  <Input
                    id="durationMin"
                    type="number"
                    min={5}
                    max={480}
                    aria-invalid={Boolean(errors.durationMin)}
                    {...register('durationMin')}
                  />
                  {errors.durationMin && (
                    <p className="text-sm text-destructive">
                      {errors.durationMin.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Fiyat</Label>
                  <Input
                    id="price"
                    type="number"
                    min={0}
                    step="0.01"
                    aria-invalid={Boolean(errors.price)}
                    {...register('price')}
                  />
                  {errors.price && (
                    <p className="text-sm text-destructive">
                      {errors.price.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Para Birimi</Label>
                <Input id="currency" {...register('currency')} />
              </div>

              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
