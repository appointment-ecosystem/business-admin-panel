// Bu dosya, işletme paneli ana dashboard sayfasını; durum kartı, özet kartları ve bugünkü randevu tablosunu içerir.
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { extractArray } from '@/api/axios';
import { getBusinessAppointments } from '@/api/business';
import { useMyBusiness } from '@/hooks/useMyBusiness';
import type { ApiError } from '@/types';
import type {
  AppointmentStatus,
  AppointmentSummary,
  BusinessStatus,
} from '@/types/business';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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

interface StatusBadgeConfig {
  label: string;
  className: string;
}

const BUSINESS_STATUS_BADGES: Record<BusinessStatus, StatusBadgeConfig> = {
  PENDING: {
    label: 'Onay Bekliyor',
    className: 'bg-yellow-100 text-yellow-800 ring-yellow-200',
  },
  APPROVED: {
    label: 'Aktif',
    className: 'bg-green-100 text-green-800 ring-green-200',
  },
  REJECTED: {
    label: 'Reddedildi',
    className: 'bg-red-100 text-red-800 ring-red-200',
  },
  SUSPENDED: {
    label: 'Askıya Alındı',
    className: 'bg-orange-100 text-orange-800 ring-orange-200',
  },
  PASSIVE: {
    label: 'Pasif',
    className: 'bg-gray-100 text-gray-700 ring-gray-200',
  },
};

const APPOINTMENT_STATUS_BADGES: Record<AppointmentStatus, StatusBadgeConfig> = {
  PENDING: {
    label: 'Bekliyor',
    className: 'bg-yellow-100 text-yellow-800 ring-yellow-200',
  },
  CONFIRMED: {
    label: 'Onaylandı',
    className: 'bg-blue-100 text-blue-800 ring-blue-200',
  },
  COMPLETED: {
    label: 'Tamamlandı',
    className: 'bg-green-100 text-green-800 ring-green-200',
  },
  CANCELLED_BY_USER: {
    label: 'Müşteri İptali',
    className: 'bg-red-100 text-red-800 ring-red-200',
  },
  CANCELLED_BY_BUSINESS: {
    label: 'İşletme İptali',
    className: 'bg-red-100 text-red-800 ring-red-200',
  },
  NO_SHOW: {
    label: 'Gelmedi',
    className: 'bg-orange-100 text-orange-800 ring-orange-200',
  },
  EXPIRED: {
    label: 'Süresi Doldu',
    className: 'bg-gray-100 text-gray-700 ring-gray-200',
  },
};

const CANCELLED_OR_NO_SHOW: AppointmentStatus[] = [
  'CANCELLED_BY_USER',
  'CANCELLED_BY_BUSINESS',
  'NO_SHOW',
];

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getAppointmentLocalDate(startTime: string): string {
  const date = new Date(startTime);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function filterTodayAppointments(
  appointments: AppointmentSummary[],
  today: string,
): AppointmentSummary[] {
  return appointments.filter(
    (appointment) => getAppointmentLocalDate(appointment.startTime) === today,
  );
}

function formatTimeRange(startTime: string, endTime: string): string {
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  };
  const start = new Date(startTime).toLocaleTimeString('tr-TR', timeOptions);
  const end = new Date(endTime).toLocaleTimeString('tr-TR', timeOptions);
  return `${start} - ${end}`;
}

function formatPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined;
    if (data?.message) {
      return data.message;
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

function StatusBadge({ config }: { config: StatusBadgeConfig }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        config.className,
      )}
    >
      {config.label}
    </span>
  );
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

interface SummaryCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
}

function SummaryCard({ title, value, icon: Icon }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" aria-hidden />
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function BusinessDashboardPage() {
  const today = getTodayDateString();
  const { business, isLoading: isBusinessLoading, isError: isBusinessError, error: businessError } =
    useMyBusiness();

  const appointmentsQuery = useQuery({
    queryKey: ['businessAppointments', business?.id, today],
    queryFn: () => getBusinessAppointments(business!.id, { date: today }),
    enabled: Boolean(business?.id),
  });

  const todayAppointments = useMemo(() => {
    const appointments = extractArray<AppointmentSummary>(
      appointmentsQuery.data?.data,
    );
    return filterTodayAppointments(appointments, today);
  }, [appointmentsQuery.data?.data, today]);

  const summary = useMemo(() => {
    const totalToday = todayAppointments.length;
    const pending = todayAppointments.filter(
      (item) => item.status === 'PENDING',
    ).length;
    const completed = todayAppointments.filter(
      (item) => item.status === 'COMPLETED',
    ).length;
    const cancelledOrNoShow = todayAppointments.filter((item) =>
      CANCELLED_OR_NO_SHOW.includes(item.status),
    ).length;

    return { totalToday, pending, completed, cancelledOrNoShow };
  }, [todayAppointments]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

      {isBusinessLoading && <LoadingSpinner label="İşletme bilgisi yükleniyor..." />}

      {isBusinessError && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {getErrorMessage(
            businessError,
            'İşletme bilgisi yüklenirken bir hata oluştu.',
          )}
        </div>
      )}

      {business && !isBusinessLoading && (
        <>
          <Card className="w-full">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold">{business.name}</CardTitle>
                {business.status === 'PENDING' && (
                  <p className="text-sm text-muted-foreground">
                    İşletmeniz admin onayı bekliyor. Onaylandıktan sonra randevu
                    alınabilir.
                  </p>
                )}
                {business.status === 'REJECTED' && (
                  <p className="text-sm text-muted-foreground">
                    İşletmeniz reddedildi. Detaylar için profilinizi inceleyin.
                  </p>
                )}
              </div>
              <StatusBadge config={BUSINESS_STATUS_BADGES[business.status]} />
            </CardHeader>
          </Card>

          {appointmentsQuery.isLoading && (
            <LoadingSpinner label="Randevu özeti yükleniyor..." />
          )}

          {appointmentsQuery.isError && (
            <div
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {getErrorMessage(
                appointmentsQuery.error,
                'Randevular yüklenirken bir hata oluştu.',
              )}
            </div>
          )}

          {!appointmentsQuery.isLoading && !appointmentsQuery.isError && (
            <>
              <div className="grid grid-cols-4 gap-4">
                <SummaryCard
                  title="Bugünkü Randevular"
                  value={summary.totalToday}
                  icon={CalendarDays}
                />
                <SummaryCard
                  title="Bekleyen Onaylar"
                  value={summary.pending}
                  icon={Clock}
                />
                <SummaryCard
                  title="Tamamlanan"
                  value={summary.completed}
                  icon={CheckCircle2}
                />
                <SummaryCard
                  title="İptal / No-Show"
                  value={summary.cancelledOrNoShow}
                  icon={XCircle}
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Bugünkü Randevular</CardTitle>
                </CardHeader>
                <CardContent>
                  {todayAppointments.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      Bugün için randevu bulunmuyor.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Saat</TableHead>
                          <TableHead>Müşteri</TableHead>
                          <TableHead>Hizmet</TableHead>
                          <TableHead>Personel</TableHead>
                          <TableHead>Durum</TableHead>
                          <TableHead className="text-right">Fiyat</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {todayAppointments.map((appointment) => (
                          <TableRow key={appointment.id}>
                            <TableCell>
                              {formatTimeRange(
                                appointment.startTime,
                                appointment.endTime,
                              )}
                            </TableCell>
                            <TableCell>{appointment.customerName}</TableCell>
                            <TableCell>{appointment.serviceName}</TableCell>
                            <TableCell>
                              {appointment.staffName ?? '—'}
                            </TableCell>
                            <TableCell>
                              <StatusBadge
                                config={
                                  APPOINTMENT_STATUS_BADGES[appointment.status]
                                }
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              {formatPrice(
                                appointment.priceSnapshot,
                                appointment.currency,
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
