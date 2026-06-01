// Bu dosya, işletme personelinin kart grid görünümünde listelendiği sayfayı içerir.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import {
  activateStaff,
  deactivateStaff,
  getStaff,
} from '@/api/business';
import { extractArray } from '@/api/axios';
import { useMyBusiness } from '@/hooks/useMyBusiness';
import type { ApiError } from '@/types';
import type { Staff } from '@/types/business';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
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

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }
  return fullName.slice(0, 2).toUpperCase();
}

function getAvatarColor(fullName: string): string {
  const colors = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-violet-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
  ];
  let hash = 0;
  for (let i = 0; i < fullName.length; i += 1) {
    hash = fullName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
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

interface StaffCardProps {
  member: Staff;
  onToggleRequest: (member: Staff) => void;
}

function StaffCard({ member, onToggleRequest }: StaffCardProps) {
  const serviceCount = member.services?.length ?? 0;

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardContent className="flex flex-1 flex-col items-center gap-3 pt-6 text-center">
        {member.profilePhotoUrl ? (
          <img
            src={member.profilePhotoUrl}
            alt={member.fullName}
            className="size-20 rounded-full object-cover"
          />
        ) : (
          <div
            className={cn(
              'flex size-20 items-center justify-center rounded-full text-xl font-semibold text-white',
              getAvatarColor(member.fullName),
            )}
          >
            {getInitials(member.fullName)}
          </div>
        )}

        <div className="space-y-1">
          <p className="font-semibold">{member.fullName}</p>
          {member.title && (
            <p className="text-sm text-muted-foreground">{member.title}</p>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          {serviceCount} hizmet
        </p>

        <span
          className={cn(
            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
            member.isActive
              ? 'bg-green-100 text-green-800 ring-green-200'
              : 'bg-gray-100 text-gray-700 ring-gray-200',
          )}
        >
          {member.isActive ? 'Aktif' : 'Pasif'}
        </span>
      </CardContent>

      <CardFooter className="flex gap-2 border-t p-4">
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <Link to={`/business/staff/${member.id}`}>Düzenle</Link>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={cn(
            'flex-1',
            member.isActive
              ? 'border-yellow-300 bg-yellow-50 text-yellow-800 hover:bg-yellow-100'
              : 'border-green-300 bg-green-50 text-green-800 hover:bg-green-100',
          )}
          onClick={() => onToggleRequest(member)}
        >
          {member.isActive ? 'Pasifleştir' : 'Aktifleştir'}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function BusinessStaffPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { business, isLoading: isBusinessLoading, isError: isBusinessError, error: businessError } =
    useMyBusiness();

  const [toggleTarget, setToggleTarget] = useState<Staff | null>(null);

  const staffQuery = useQuery({
    queryKey: ['staff', business?.id],
    queryFn: () => getStaff(business!.id),
    enabled: Boolean(business?.id),
  });

  const invalidateStaff = () => {
    if (business?.id) {
      void queryClient.invalidateQueries({ queryKey: ['staff', business.id] });
    }
  };

  const toggleMutation = useMutation({
    mutationFn: (member: Staff) => {
      if (!business?.id) {
        throw new Error('İşletme bilgisi bulunamadı.');
      }
      if (member.isActive) {
        return deactivateStaff(business.id, member.id);
      }
      return activateStaff(business.id, member.id);
    },
    onSuccess: (updatedStaff) => {
      toast.success(
        updatedStaff.data.isActive
          ? 'Personel aktifleştirildi'
          : 'Personel pasifleştirildi',
      );
      setToggleTarget(null);
      invalidateStaff();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'İşlem başarısız oldu.'));
    },
  });

  const staffList = extractArray<Staff>(staffQuery.data?.data);
  const isDeactivateAction = toggleTarget?.isActive ?? false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Personel</h1>
        {business && (
          <Button onClick={() => navigate('/business/staff/new')}>
            Yeni Personel Ekle
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
        <>
          {staffQuery.isLoading && (
            <LoadingSpinner label="Personel yükleniyor..." />
          )}

          {staffQuery.isError && (
            <p className="text-sm text-destructive" role="alert">
              {getErrorMessage(
                staffQuery.error,
                'Personel yüklenirken bir hata oluştu.',
              )}
            </p>
          )}

          {!staffQuery.isLoading &&
            !staffQuery.isError &&
            staffList.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Henüz personel eklenmemiş.
              </p>
            )}

          {!staffQuery.isLoading && !staffQuery.isError && staffList.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {staffList.map((member) => (
                <StaffCard
                  key={member.id}
                  member={member}
                  onToggleRequest={setToggleTarget}
                />
              ))}
            </div>
          )}
        </>
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
              {isDeactivateAction ? 'Personeli pasifleştir' : 'Personeli aktifleştir'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isDeactivateAction
                ? 'Bu personeli pasifleştirmek istediğinizden emin misiniz?'
                : 'Bu personeli aktifleştirmek istediğinizden emin misiniz?'}
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
