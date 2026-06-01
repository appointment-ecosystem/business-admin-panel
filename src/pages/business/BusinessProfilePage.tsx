// Bu dosya, işletme profil bilgileri formu ve fotoğraf yönetimi bölümlerini içerir.
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import {
  deleteBusinessPhoto,
  getBusinessById,
  getBusinessPhotos,
  setCoverPhoto,
  updateBusiness,
  uploadBusinessPhoto,
} from '@/api/business';
import { extractArray } from '@/api/axios';
import { useMyBusiness } from '@/hooks/useMyBusiness';
import type { ApiError } from '@/types';
import type { BusinessPhoto } from '@/types/business';
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

const profileSchema = z.object({
  name: z.string().min(1, 'İşletme adı zorunludur').min(2, 'İşletme adı en az 2 karakter olmalıdır'),
  description: z.string().optional(),
  phone: z
    .string()
    .optional()
    .refine((value) => !value || value.length >= 10, {
      message: 'Telefon en az 10 karakter olmalıdır',
    }),
  email: z
    .string()
    .optional()
    .refine((value) => !value || z.string().email().safeParse(value).success, {
      message: 'Geçerli bir e-posta adresi girin',
    }),
  website: z.string().optional(),
  addressLine: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

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

interface PhotoCardProps {
  photo: BusinessPhoto;
  businessId: string;
  onDeleteRequest: (photo: BusinessPhoto) => void;
  onCoverSet: () => void;
}

function PhotoCard({
  photo,
  businessId,
  onDeleteRequest,
  onCoverSet,
}: PhotoCardProps) {
  const setCoverMutation = useMutation({
    mutationFn: () => setCoverPhoto(businessId, photo.id),
    onSuccess: () => {
      toast.success('Kapak fotoğrafı güncellendi');
      onCoverSet();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Kapak fotoğrafı ayarlanamadı.'));
    },
  });

  return (
    <div className="overflow-hidden rounded-lg border bg-card ring-1 ring-foreground/10">
      <div className="relative aspect-square">
        <img
          src={photo.url}
          alt={photo.fileName}
          className="h-full w-full object-cover"
        />
        {photo.isCover && (
          <span className="absolute left-2 top-2 rounded-full bg-green-600 px-2 py-0.5 text-xs font-medium text-white">
            Kapak
          </span>
        )}
      </div>
      <div className="flex gap-2 p-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          disabled={photo.isCover || setCoverMutation.isPending}
          onClick={() => setCoverMutation.mutate()}
        >
          Kapak Yap
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="flex-1"
          onClick={() => onDeleteRequest(photo)}
        >
          Sil
        </Button>
      </div>
    </div>
  );
}

interface PhotoManagementSectionProps {
  businessId: string;
}

function PhotoManagementSection({ businessId }: PhotoManagementSectionProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoToDelete, setPhotoToDelete] = useState<BusinessPhoto | null>(null);

  const photosQuery = useQuery({
    queryKey: ['businessPhotos', businessId],
    queryFn: () => getBusinessPhotos(businessId),
  });

  const invalidatePhotos = () => {
    void queryClient.invalidateQueries({
      queryKey: ['businessPhotos', businessId],
    });
  };

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadBusinessPhoto(businessId, file),
    onSuccess: () => {
      toast.success('Fotoğraf yüklendi');
      invalidatePhotos();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Fotoğraf yüklenemedi.'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (photoId: string) => deleteBusinessPhoto(businessId, photoId),
    onSuccess: () => {
      toast.success('Fotoğraf silindi');
      setPhotoToDelete(null);
      invalidatePhotos();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Fotoğraf silinemedi.'));
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    uploadMutation.mutate(file);
    event.target.value = '';
  };

  const photos = extractArray<BusinessPhoto>(photosQuery.data?.data);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fotoğraf Yönetimi</CardTitle>
        <CardDescription>
          İşletme fotoğraflarınızı yükleyin, kapak seçin veya silin.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {photosQuery.isLoading && <LoadingSpinner label="Fotoğraflar yükleniyor..." />}

        {photosQuery.isError && (
          <p className="text-sm text-destructive" role="alert">
            {getErrorMessage(
              photosQuery.error,
              'Fotoğraflar yüklenirken bir hata oluştu.',
            )}
          </p>
        )}

        {!photosQuery.isLoading && !photosQuery.isError && (
          <>
            {photos.length === 0 && !uploadMutation.isPending && (
              <p className="mb-4 text-sm text-muted-foreground">
                Henüz fotoğraf eklenmemiş.
              </p>
            )}

            <div className="grid grid-cols-4 gap-4">
              {photos.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  businessId={businessId}
                  onDeleteRequest={setPhotoToDelete}
                  onCoverSet={invalidatePhotos}
                />
              ))}

              <button
                type="button"
                className={cn(
                  'flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/40 bg-muted/20 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-muted/40 hover:text-foreground',
                  uploadMutation.isPending && 'pointer-events-none opacity-60',
                )}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? (
                  <div
                    className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary"
                    role="status"
                    aria-label="Yükleniyor"
                  />
                ) : (
                  <>
                    <Upload className="size-6" aria-hidden />
                    <span>Fotoğraf Ekle</span>
                  </>
                )}
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </>
        )}

        <AlertDialog
          open={photoToDelete !== null}
          onOpenChange={(open) => {
            if (!open) {
              setPhotoToDelete(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Fotoğrafı sil</AlertDialogTitle>
              <AlertDialogDescription>
                Bu fotoğrafı silmek istediğinize emin misiniz? Bu işlem geri
                alınamaz.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>İptal</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (photoToDelete) {
                    deleteMutation.mutate(photoToDelete.id);
                  }
                }}
              >
                Sil
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

export default function BusinessProfilePage() {
  const queryClient = useQueryClient();
  const { business, isLoading: isBusinessLoading, isError: isBusinessError, error: businessError } =
    useMyBusiness();

  const businessDetailQuery = useQuery({
    queryKey: ['businessDetail', business?.id],
    queryFn: () => getBusinessById(business!.id),
    enabled: Boolean(business?.id),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      description: '',
      phone: '',
      email: '',
      website: '',
      addressLine: '',
    },
  });

  useEffect(() => {
    const detail = businessDetailQuery.data?.data;
    const summary = business;

    if (!detail && !summary) {
      return;
    }

    reset({
      name: detail?.name ?? summary?.name ?? '',
      description: detail?.description ?? summary?.description ?? '',
      phone: detail?.phone ?? summary?.phone ?? '',
      email: detail?.email ?? summary?.email ?? '',
      website: detail?.website ?? '',
      addressLine: detail?.addressLine ?? summary?.address_line ?? '',
    });
  }, [business, businessDetailQuery.data?.data, reset]);

  const updateMutation = useMutation({
    mutationFn: (values: ProfileFormValues) => {
      if (!business?.id) {
        throw new Error('İşletme bilgisi bulunamadı.');
      }

      const payload = {
        name: values.name,
        description: values.description || undefined,
        phone: values.phone || undefined,
        email: values.email || undefined,
        website: values.website || undefined,
        addressLine: values.addressLine || undefined,
      };

      return updateBusiness(business.id, payload);
    },
    onSuccess: () => {
      toast.success('Profil güncellendi');
      void queryClient.invalidateQueries({ queryKey: ['myBusiness'] });
      if (business?.id) {
        void queryClient.invalidateQueries({
          queryKey: ['businessDetail', business.id],
        });
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Profil güncellenemedi.'));
    },
  });

  const onSubmit = (values: ProfileFormValues) => {
    updateMutation.mutate(values);
  };

  const isSaving = isSubmitting || updateMutation.isPending;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">İşletme Profili</h1>

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
        <>
          <Card>
            <CardHeader>
              <CardTitle>Profil Bilgileri</CardTitle>
              <CardDescription>
                İşletmenizin temel bilgilerini güncelleyin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {businessDetailQuery.isLoading && (
                <LoadingSpinner label="Profil detayları yükleniyor..." />
              )}

              {!businessDetailQuery.isLoading && (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="name">İşletme Adı</Label>
                      <Input
                        id="name"
                        aria-invalid={Boolean(errors.name)}
                        {...register('name')}
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive">
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="description">Açıklama</Label>
                      <Textarea
                        id="description"
                        rows={4}
                        aria-invalid={Boolean(errors.description)}
                        {...register('description')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon</Label>
                      <Input
                        id="phone"
                        type="tel"
                        aria-invalid={Boolean(errors.phone)}
                        {...register('phone')}
                      />
                      {errors.phone && (
                        <p className="text-sm text-destructive">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">E-posta</Label>
                      <Input
                        id="email"
                        type="email"
                        aria-invalid={Boolean(errors.email)}
                        {...register('email')}
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        placeholder="https://"
                        {...register('website')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="addressLine">Adres</Label>
                      <Input id="addressLine" {...register('addressLine')} />
                    </div>
                  </div>

                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <PhotoManagementSection businessId={business.id} />
        </>
      )}
    </div>
  );
}
