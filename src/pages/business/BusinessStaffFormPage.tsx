// Bu dosya, yeni personel ekleme, personel düzenleme ve hizmet atama formunu içerir.
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import {
  assignStaffServices,
  createStaff,
  getServices,
  getStaff,
  removeStaffServices,
  updateStaff,
} from '@/api/business';
import { extractArray } from '@/api/axios';
import { useMyBusiness } from '@/hooks/useMyBusiness';
import type { ApiError } from '@/types';
import type { Service, Staff } from '@/types/business';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const staffSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Ad soyad zorunludur')
    .min(2, 'Ad soyad en az 2 karakter olmalıdır'),
  title: z.string().optional(),
  bio: z.string().optional(),
});

type StaffFormValues = z.infer<typeof staffSchema>;

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

export default function BusinessStaffFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id: staffId } = useParams<{ id: string }>();
  const isEditMode = Boolean(staffId);

  const { business, isLoading: isBusinessLoading } = useMyBusiness();

  const staffQuery = useQuery({
    queryKey: ['staff', business?.id],
    queryFn: () => getStaff(business!.id),
    enabled: Boolean(business?.id && isEditMode),
  });

  const servicesQuery = useQuery({
    queryKey: ['services', business?.id],
    queryFn: () => getServices(business!.id),
    enabled: Boolean(business?.id && isEditMode),
  });

  const existingStaff = useMemo(() => {
    const staffList = extractArray<Staff>(staffQuery.data?.data);
    if (!isEditMode || !staffId || staffList.length === 0) {
      return null;
    }
    return staffList.find((member) => member.id === staffId) ?? null;
  }, [isEditMode, staffId, staffQuery.data?.data]);

  const activeServices = useMemo(
    () =>
      extractArray<Service>(servicesQuery.data?.data).filter(
        (service) => service.isActive,
      ),
    [servicesQuery.data?.data],
  );

  const initialAssignedIds = useMemo(
    () => new Set(existingStaff?.services?.map((service) => service.id) ?? []),
    [existingStaff],
  );

  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(
    new Set(),
  );
  const [servicesInitialized, setServicesInitialized] = useState(false);

  useEffect(() => {
    if (isEditMode && existingStaff && !servicesInitialized) {
      setSelectedServiceIds(
        new Set(existingStaff.services?.map((service) => service.id) ?? []),
      );
      setServicesInitialized(true);
    }
  }, [isEditMode, existingStaff, servicesInitialized]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      fullName: '',
      title: '',
      bio: '',
    },
  });

  useEffect(() => {
    if (!isEditMode) {
      reset({ fullName: '', title: '', bio: '' });
      return;
    }

    if (existingStaff) {
      reset({
        fullName: existingStaff.fullName,
        title: existingStaff.title ?? '',
        bio: existingStaff.bio ?? '',
      });
    }
  }, [isEditMode, existingStaff, reset]);

  const invalidateStaff = () => {
    if (business?.id) {
      void queryClient.invalidateQueries({ queryKey: ['staff', business.id] });
    }
  };

  const saveStaffMutation = useMutation({
    mutationFn: (values: StaffFormValues) => {
      if (!business?.id) {
        throw new Error('İşletme bilgisi bulunamadı.');
      }

      const payload = {
        fullName: values.fullName,
        title: values.title || undefined,
        bio: values.bio || undefined,
      };

      if (isEditMode && staffId) {
        return updateStaff(business.id, staffId, payload);
      }

      return createStaff(business.id, payload);
    },
    onSuccess: (savedStaff) => {
      toast.success(
        isEditMode ? 'Personel güncellendi' : 'Personel oluşturuldu',
      );
      invalidateStaff();

      if (!isEditMode) {
        navigate(`/business/staff/${savedStaff.data.id}`);
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Kayıt işlemi başarısız oldu.'));
    },
  });

  const saveServicesMutation = useMutation({
    mutationFn: async () => {
      if (!business?.id || !staffId) {
        throw new Error('Personel bilgisi bulunamadı.');
      }

      const toAssign = Array.from(selectedServiceIds).filter(
        (id) => !initialAssignedIds.has(id),
      );
      const toRemove = Array.from(initialAssignedIds).filter(
        (id) => !selectedServiceIds.has(id),
      );

      if (toAssign.length > 0) {
        await assignStaffServices(business.id, staffId, {
          serviceIds: toAssign,
        });
      }

      if (toRemove.length > 0) {
        await removeStaffServices(business.id, staffId, {
          serviceIds: toRemove,
        });
      }
    },
    onSuccess: () => {
      toast.success('Hizmet atamaları güncellendi');
      invalidateStaff();
      void staffQuery.refetch();
      setServicesInitialized(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Hizmet ataması başarısız oldu.'));
    },
  });

  const onSubmitStaff = (values: StaffFormValues) => {
    saveStaffMutation.mutate(values);
  };

  const toggleService = (serviceId: string, checked: boolean) => {
    setSelectedServiceIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(serviceId);
      } else {
        next.delete(serviceId);
      }
      return next;
    });
  };

  const isSavingStaff = isSubmitting || saveStaffMutation.isPending;
  const isSavingServices = saveServicesMutation.isPending;
  const isFormLoading =
    isBusinessLoading || (isEditMode && staffQuery.isLoading);

  const showNotFound =
    isEditMode &&
    !staffQuery.isLoading &&
    !staffQuery.isError &&
    extractArray<Staff>(staffQuery.data?.data).length > 0 &&
    !existingStaff;

  const hasServiceChanges = useMemo(() => {
    if (!isEditMode) {
      return false;
    }
    const current = selectedServiceIds;
    if (current.size !== initialAssignedIds.size) {
      return true;
    }
    for (const id of current) {
      if (!initialAssignedIds.has(id)) {
        return true;
      }
    }
    return false;
  }, [isEditMode, selectedServiceIds, initialAssignedIds]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        to="/business/staff"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Personele Dön
      </Link>

      <h1 className="text-3xl font-bold tracking-tight">
        {isEditMode ? 'Personeli Düzenle' : 'Yeni Personel'}
      </h1>

      {isFormLoading && <LoadingSpinner label="Form yükleniyor..." />}

      {showNotFound && (
        <p className="text-sm text-destructive" role="alert">
          Personel bulunamadı.
        </p>
      )}

      {staffQuery.isError && isEditMode && (
        <p className="text-sm text-destructive" role="alert">
          {getErrorMessage(
            staffQuery.error,
            'Personel bilgisi yüklenirken bir hata oluştu.',
          )}
        </p>
      )}

      {business && !isFormLoading && !showNotFound && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Temel Bilgiler</CardTitle>
              <CardDescription>
                Personelin ad, unvan ve biyografi bilgilerini girin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit(onSubmitStaff)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="fullName">Ad Soyad</Label>
                  <Input
                    id="fullName"
                    aria-invalid={Boolean(errors.fullName)}
                    {...register('fullName')}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Unvan</Label>
                  <Input id="title" {...register('title')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Biyografi</Label>
                  <Textarea id="bio" rows={4} {...register('bio')} />
                </div>

                <Button type="submit" disabled={isSavingStaff || isSavingServices}>
                  {isSavingStaff ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {isEditMode && existingStaff && (
            <Card>
              <CardHeader>
                <CardTitle>Hizmet Atama</CardTitle>
                <CardDescription>
                  Personelin verebileceği hizmetleri seçin.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {servicesQuery.isLoading && (
                  <LoadingSpinner label="Hizmetler yükleniyor..." />
                )}

                {servicesQuery.isError && (
                  <p className="text-sm text-destructive" role="alert">
                    {getErrorMessage(
                      servicesQuery.error,
                      'Hizmetler yüklenirken bir hata oluştu.',
                    )}
                  </p>
                )}

                {!servicesQuery.isLoading && !servicesQuery.isError && (
                  <>
                    {activeServices.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Atanabilir aktif hizmet bulunmuyor.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {activeServices.map((service) => {
                          const checked = selectedServiceIds.has(service.id);
                          return (
                            <label
                              key={service.id}
                              className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(value) =>
                                  toggleService(service.id, value === true)
                                }
                                disabled={isSavingStaff || isSavingServices}
                              />
                              <span className="text-sm font-medium">
                                {service.name}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    <Button
                      type="button"
                      variant="secondary"
                      disabled={
                        isSavingServices ||
                        isSavingStaff ||
                        !hasServiceChanges ||
                        activeServices.length === 0
                      }
                      onClick={() => saveServicesMutation.mutate()}
                    >
                      {isSavingServices
                        ? 'Hizmetler kaydediliyor...'
                        : 'Hizmetleri Kaydet'}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {!isEditMode && (
            <p className="rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              Hizmet atamak için önce personeli kaydedin.
            </p>
          )}
        </>
      )}
    </div>
  );
}
