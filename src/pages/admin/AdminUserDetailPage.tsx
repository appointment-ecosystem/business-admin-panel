// Bu dosya, admin panelinde kullanıcı detayını, rol/durum aksiyonlarını ve randevu listesini içerir.
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import {
  activateUser,
  deactivateUser,
  getAdminUser,
  getUserAppointments,
  updateUserRole,
} from '@/api/admin';
import { extractArray } from '@/api/axios';
import type { UserRole } from '@/types';
import type { AdminUserAppointment } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  appointmentStatusLabel,
  DataTable,
  EmptyState,
  formatDate,
  formatDateTime,
  formatPrice,
  getErrorMessage,
  LoadingState,
  roleLabel,
  StatusBadge,
} from '@/pages/admin/adminUtils';

type EditableRole = Extract<UserRole, 'USER' | 'BUSINESS_OWNER' | 'ADMIN'>;

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 border-b py-3 last:border-b-0 md:grid-cols-[180px_1fr]">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<EditableRole>('USER');

  const userQuery = useQuery({
    queryKey: ['adminUser', id],
    queryFn: () => getAdminUser(id!),
    enabled: Boolean(id),
  });

  const appointmentsQuery = useQuery({
    queryKey: ['adminUserAppointments', id],
    queryFn: () => getUserAppointments(id!),
    enabled: Boolean(id),
  });

  useEffect(() => {
    const role = userQuery.data?.data.role;
    if (role === 'USER' || role === 'BUSINESS_OWNER' || role === 'ADMIN') {
      setSelectedRole(role);
    }
  }, [userQuery.data?.data.role]);

  const invalidateUser = () => {
    void queryClient.invalidateQueries({ queryKey: ['adminUser', id] });
    void queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
  };

  const statusMutation = useMutation({
    mutationFn: () => {
      if (!id || !userQuery.data?.data) {
        throw new Error('Kullanıcı bilgisi bulunamadı.');
      }
      return userQuery.data.data.isActive ? deactivateUser(id) : activateUser(id);
    },
    onSuccess: (response) => {
      toast.success(response.data.isActive ? 'Kullanıcı aktifleştirildi' : 'Kullanıcı pasifleştirildi');
      invalidateUser();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Kullanıcı durumu güncellenemedi.'));
    },
  });

  const roleMutation = useMutation({
    mutationFn: () => {
      if (!id) {
        throw new Error('Kullanıcı kimliği bulunamadı.');
      }
      return updateUserRole(id, selectedRole);
    },
    onSuccess: () => {
      toast.success('Kullanıcı rolü güncellendi');
      invalidateUser();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Kullanıcı rolü güncellenemedi.'));
    },
  });

  const appointmentColumns = useMemo<ColumnDef<AdminUserAppointment>[]>(
    () => [
      {
        accessorKey: 'startTime',
        header: 'Tarih',
        cell: ({ row }) => formatDateTime(row.original.startTime),
      },
      {
        accessorKey: 'businessName',
        header: 'İşletme',
      },
      {
        accessorKey: 'serviceName',
        header: 'Hizmet',
      },
      {
        accessorKey: 'status',
        header: 'Durum',
        cell: ({ row }) => appointmentStatusLabel(row.original.status),
      },
      {
        accessorKey: 'priceSnapshot',
        header: 'Fiyat',
        cell: ({ row }) =>
          formatPrice(row.original.priceSnapshot, row.original.currency),
      },
    ],
    [],
  );

  const user = userQuery.data?.data;
  const appointments = extractArray<AdminUserAppointment>(
    appointmentsQuery.data?.data,
  );

  if (!id) {
    return <EmptyState message="Kullanıcı kimliği bulunamadı." />;
  }

  return (
    <div className="space-y-6">
      <Button variant="link" className="h-auto px-0" asChild>
        <Link to="/admin/users">← Kullanıcılara Dön</Link>
      </Button>

      {userQuery.isLoading && (
        <LoadingState label="Kullanıcı bilgisi yükleniyor..." />
      )}

      {userQuery.isError && (
        <p className="text-sm text-destructive" role="alert">
          {getErrorMessage(
            userQuery.error,
            'Kullanıcı bilgisi yüklenirken bir hata oluştu.',
          )}
        </p>
      )}

      {user && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight">
              {user.fullName}
            </h1>
            <Button
              type="button"
              variant={user.isActive ? 'destructive' : 'outline'}
              className={
                user.isActive
                  ? undefined
                  : 'border-green-300 bg-green-50 text-green-800 hover:bg-green-100'
              }
              disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate()}
            >
              {user.isActive ? 'Pasifleştir' : 'Aktifleştir'}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Kullanıcı Bilgileri</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailRow label="Ad" value={user.fullName} />
              <DetailRow label="Telefon" value={user.phone} />
              <DetailRow label="Email" value={user.email ?? '-'} />
              <DetailRow
                label="Rol"
                value={<StatusBadge tone="blue">{roleLabel(user.role)}</StatusBadge>}
              />
              <DetailRow
                label="Durum"
                value={
                  <StatusBadge tone={user.isActive ? 'green' : 'red'}>
                    {user.isActive ? 'Aktif' : 'Pasif'}
                  </StatusBadge>
                }
              />
              <DetailRow label="Kayıt Tarihi" value={formatDate(user.createdAt)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rol Değiştir</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-end gap-3">
              <Select
                value={selectedRole}
                onValueChange={(value) => setSelectedRole(value as EditableRole)}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Rol seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">USER</SelectItem>
                  <SelectItem value="BUSINESS_OWNER">BUSINESS_OWNER</SelectItem>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                disabled={roleMutation.isPending || selectedRole === user.role}
                onClick={() => roleMutation.mutate()}
              >
                Rolü Güncelle
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Randevular</CardTitle>
            </CardHeader>
            <CardContent className={appointments.length > 0 ? 'p-0' : undefined}>
              {appointmentsQuery.isLoading && (
                <LoadingState label="Randevular yükleniyor..." />
              )}
              {appointmentsQuery.isError && (
                <p className="text-sm text-destructive" role="alert">
                  {getErrorMessage(
                    appointmentsQuery.error,
                    'Randevular yüklenirken bir hata oluştu.',
                  )}
                </p>
              )}
              {!appointmentsQuery.isLoading &&
                !appointmentsQuery.isError &&
                appointments.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Kullanıcıya ait randevu bulunamadı.
                  </p>
                )}
              {!appointmentsQuery.isLoading &&
                !appointmentsQuery.isError &&
                appointments.length > 0 && (
                  <DataTable data={appointments} columns={appointmentColumns} />
                )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
