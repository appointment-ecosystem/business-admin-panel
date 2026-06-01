// Bu dosya, admin panelinde kullanıcıların tablo halinde listelendiği sayfayı içerir.
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { getAdminUsers } from '@/api/admin';
import { extractArray } from '@/api/axios';
import type { AdminUser } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DataTable,
  EmptyState,
  formatDate,
  getErrorMessage,
  LoadingState,
  roleLabel,
  StatusBadge,
} from '@/pages/admin/adminUtils';

const columns: ColumnDef<AdminUser>[] = [
  {
    accessorKey: 'fullName',
    header: 'Ad Soyad',
    cell: ({ row }) => (
      <span className="font-medium">{row.original.fullName}</span>
    ),
  },
  {
    accessorKey: 'phone',
    header: 'Telefon',
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => row.original.email ?? '-',
  },
  {
    accessorKey: 'role',
    header: 'Rol',
    cell: ({ row }) => (
      <StatusBadge tone="blue">{roleLabel(row.original.role)}</StatusBadge>
    ),
  },
  {
    accessorKey: 'isActive',
    header: 'Durum',
    cell: ({ row }) => (
      <StatusBadge tone={row.original.isActive ? 'green' : 'red'}>
        {row.original.isActive ? 'Aktif' : 'Pasif'}
      </StatusBadge>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Kayıt Tarihi',
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    id: 'actions',
    header: 'İşlemler',
    cell: ({ row }) => (
      <Button variant="outline" size="sm" asChild>
        <Link to={`/admin/users/${row.original.id}`}>Detay</Link>
      </Button>
    ),
  },
];

export default function AdminUsersPage() {
  const usersQuery = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => getAdminUsers(),
  });

  const users = extractArray<AdminUser>(usersQuery.data?.data);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Kullanıcılar</h1>

      {usersQuery.isLoading && <LoadingState label="Kullanıcılar yükleniyor..." />}

      {usersQuery.isError && (
        <p className="text-sm text-destructive" role="alert">
          {getErrorMessage(
            usersQuery.error,
            'Kullanıcılar yüklenirken bir hata oluştu.',
          )}
        </p>
      )}

      {!usersQuery.isLoading && !usersQuery.isError && users.length === 0 && (
        <EmptyState message="Henüz kullanıcı bulunamadı." />
      )}

      {!usersQuery.isLoading && !usersQuery.isError && users.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <DataTable data={users} columns={columns} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
