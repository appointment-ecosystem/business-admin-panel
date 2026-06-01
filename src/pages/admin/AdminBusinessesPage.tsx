// Bu dosya, admin panelinde işletmelerin filtrelenebilir tablo listesini içerir.
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { getAdminBusinesses } from '@/api/admin';
import { extractArray } from '@/api/axios';
import type { AdminBusiness } from '@/types/admin';
import type { BusinessStatus } from '@/types';
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
  businessStatusLabel,
  businessStatusTone,
  DataTable,
  EmptyState,
  formatDate,
  getErrorMessage,
  LoadingState,
  StatusBadge,
} from '@/pages/admin/adminUtils';

type BusinessStatusFilter = 'all' | Extract<
  BusinessStatus,
  'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
>;

const columns: ColumnDef<AdminBusiness>[] = [
  {
    accessorKey: 'name',
    header: 'İşletme Adı',
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: 'ownerName',
    header: 'Sahip',
  },
  {
    accessorKey: 'phone',
    header: 'Telefon',
    cell: ({ row }) => row.original.phone ?? '-',
  },
  {
    accessorKey: 'status',
    header: 'Durum',
    cell: ({ row }) => (
      <StatusBadge tone={businessStatusTone(row.original.status)}>
        {businessStatusLabel(row.original.status)}
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
        <Link to={`/admin/businesses/${row.original.id}`}>Detay</Link>
      </Button>
    ),
  },
];

export default function AdminBusinessesPage() {
  const [statusFilter, setStatusFilter] =
    useState<BusinessStatusFilter>('all');

  const businessesQuery = useQuery({
    queryKey: ['adminBusinesses'],
    queryFn: () => getAdminBusinesses(),
  });

  const filteredBusinesses = useMemo(() => {
    const businesses = extractArray<AdminBusiness>(businessesQuery.data?.data);
    if (statusFilter === 'all') {
      return businesses;
    }
    return businesses.filter((business) => business.status === statusFilter);
  }, [businessesQuery.data?.data, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">İşletmeler</h1>
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as BusinessStatusFilter)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Durum seçin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="PENDING">Bekleyen</SelectItem>
            <SelectItem value="APPROVED">Onaylı</SelectItem>
            <SelectItem value="REJECTED">Reddedildi</SelectItem>
            <SelectItem value="SUSPENDED">Askıda</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {businessesQuery.isLoading && (
        <LoadingState label="İşletmeler yükleniyor..." />
      )}

      {businessesQuery.isError && (
        <p className="text-sm text-destructive" role="alert">
          {getErrorMessage(
            businessesQuery.error,
            'İşletmeler yüklenirken bir hata oluştu.',
          )}
        </p>
      )}

      {!businessesQuery.isLoading &&
        !businessesQuery.isError &&
        filteredBusinesses.length === 0 && (
          <EmptyState message="Bu filtreye uygun işletme bulunamadı." />
        )}

      {!businessesQuery.isLoading &&
        !businessesQuery.isError &&
        filteredBusinesses.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <DataTable data={filteredBusinesses} columns={columns} />
            </CardContent>
          </Card>
        )}
    </div>
  );
}
