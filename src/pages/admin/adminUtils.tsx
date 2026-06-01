// Bu dosya, admin sayfalarında kullanılan ortak tablo, rozet, tarih ve durum yardımcılarını içerir.
import axios from 'axios';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import type { ApiError, AppointmentStatus, BusinessStatus, UserRole } from '@/types';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined;
    if (data?.message) {
      return data.message;
    }
  }
  return fallback;
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
    }).format(price);
  } catch {
    return `${price.toLocaleString('tr-TR')} ${currency}`;
  }
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12">
      <div
        className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary"
        role="status"
        aria-label={label}
      />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center text-sm text-muted-foreground">
        {message}
      </CardContent>
    </Card>
  );
}

export function StatusBadge({
  children,
  tone,
}: {
  children: string;
  tone: 'green' | 'red' | 'yellow' | 'gray' | 'blue';
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
        tone === 'green' && 'bg-green-100 text-green-800 ring-green-200',
        tone === 'red' && 'bg-red-100 text-red-800 ring-red-200',
        tone === 'yellow' && 'bg-yellow-100 text-yellow-800 ring-yellow-200',
        tone === 'gray' && 'bg-gray-100 text-gray-700 ring-gray-200',
        tone === 'blue' && 'bg-blue-100 text-blue-800 ring-blue-200',
      )}
    >
      {children}
    </span>
  );
}

export function businessStatusLabel(status: BusinessStatus): string {
  const labels: Record<BusinessStatus, string> = {
    PENDING: 'Bekleyen',
    APPROVED: 'Onaylı',
    REJECTED: 'Reddedildi',
    SUSPENDED: 'Askıda',
    PASSIVE: 'Pasif',
  };
  return labels[status];
}

export function businessStatusTone(
  status: BusinessStatus,
): 'green' | 'red' | 'yellow' | 'gray' {
  if (status === 'APPROVED') {
    return 'green';
  }
  if (status === 'REJECTED') {
    return 'red';
  }
  if (status === 'PENDING' || status === 'SUSPENDED') {
    return 'yellow';
  }
  return 'gray';
}

export function roleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    USER: 'Kullanıcı',
    BUSINESS_OWNER: 'İşletme Sahibi',
    BUSINESS_EMPLOYEE: 'İşletme Çalışanı',
    ADMIN: 'Admin',
  };
  return labels[role];
}

export function appointmentStatusLabel(status: AppointmentStatus): string {
  const labels: Record<AppointmentStatus, string> = {
    PENDING: 'Bekleyen',
    CONFIRMED: 'Onaylı',
    CANCELLED_BY_USER: 'Kullanıcı İptal',
    CANCELLED_BY_BUSINESS: 'İşletme İptal',
    COMPLETED: 'Tamamlandı',
    NO_SHOW: 'No-Show',
    EXPIRED: 'Süresi Geçti',
  };
  return labels[status];
}

export function DataTable<TData>({
  data,
  columns,
}: {
  data: TData[];
  columns: ColumnDef<TData>[];
}) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
