// Bu dosya, işletme randevularının takvim ve liste görünümü ile detay/aksiyon yönetimini içerir.
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import trLocale from '@fullcalendar/core/locales/tr';
import type { DatesSetArg, EventClickArg, EventInput } from '@fullcalendar/core';
import axios from 'axios';
import { toast } from 'sonner';
import {
  cancelAppointmentByBusiness,
  completeAppointment,
  confirmAppointment,
  markNoShow,
} from '@/api/appointments';
import { extractArray } from '@/api/axios';
import { getBusinessAppointments } from '@/api/business';
import type { GetBusinessAppointmentsParams } from '@/api/business';
import { useMyBusiness } from '@/hooks/useMyBusiness';
import type { ApiError } from '@/types';
import type { AppointmentStatus, AppointmentSummary } from '@/types/business';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

type ViewMode = 'calendar' | 'list';

type StatusFilter =
  | 'all'
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no-show';

interface StatusBadgeConfig {
  label: string;
  className: string;
}

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
    className: 'bg-purple-100 text-purple-800 ring-purple-200',
  },
  EXPIRED: {
    label: 'Süresi Doldu',
    className: 'bg-gray-100 text-gray-700 ring-gray-200',
  },
};

const EVENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  PENDING: '#f59e0b',
  CONFIRMED: '#3b82f6',
  COMPLETED: '#10b981',
  CANCELLED_BY_USER: '#ef4444',
  CANCELLED_BY_BUSINESS: '#ef4444',
  NO_SHOW: '#8b5cf6',
  EXPIRED: '#6b7280',
};

interface CalendarEventExtendedProps {
  appointment: AppointmentSummary;
}

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateToYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateTimeRange(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const datePart = start.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  });
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  };
  const startPart = start.toLocaleTimeString('tr-TR', timeOptions);
  const endPart = end.toLocaleTimeString('tr-TR', timeOptions);
  return `${datePart}, ${startPart} - ${endPart}`;
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
  return fallback;
}

function getApiStatusFilter(filter: StatusFilter): string | undefined {
  switch (filter) {
    case 'pending':
      return 'PENDING';
    case 'confirmed':
      return 'CONFIRMED';
    case 'completed':
      return 'COMPLETED';
    case 'no-show':
      return 'NO_SHOW';
    default:
      return undefined;
  }
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const config = APPOINTMENT_STATUS_BADGES[status];
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        config.className,
      )}
    >
      {config.label}
    </span>
  );
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

interface AppointmentDetailDialogProps {
  appointment: AppointmentSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string | undefined;
  onActionComplete: () => void;
}

function AppointmentDetailDialog({
  appointment,
  open,
  onOpenChange,
  businessId,
  onActionComplete,
}: AppointmentDetailDialogProps) {
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const closeDialog = () => {
    onOpenChange(false);
    setShowCancelForm(false);
    setCancelReason('');
  };

  const actionMutation = useMutation({
    mutationFn: async (action: 'confirm' | 'cancel' | 'complete' | 'no-show') => {
      if (!appointment) {
        throw new Error('Randevu bulunamadı.');
      }
      switch (action) {
        case 'confirm':
          return confirmAppointment(appointment.id);
        case 'cancel':
          return cancelAppointmentByBusiness(
            appointment.id,
            cancelReason.trim() || undefined,
          );
        case 'complete':
          return completeAppointment(appointment.id);
        case 'no-show':
          return markNoShow(appointment.id);
      }
    },
    onSuccess: (_, action) => {
      const messages: Record<typeof action, string> = {
        confirm: 'Randevu onaylandı',
        cancel: 'Randevu iptal edildi',
        complete: 'Randevu tamamlandı olarak işaretlendi',
        'no-show': 'Randevu gelmedi olarak işaretlendi',
      };
      toast.success(messages[action]);
      closeDialog();
      onActionComplete();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'İşlem başarısız oldu.'));
    },
  });

  if (!appointment) {
    return null;
  }

  const isActionPending = actionMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          closeDialog();
        } else {
          onOpenChange(true);
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">{appointment.customerName}</DialogTitle>
          <DialogDescription>Randevu detayları</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Durum</span>
            <StatusBadge status={appointment.status} />
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Hizmet</span>
            <span className="text-right font-medium">{appointment.serviceName}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Personel</span>
            <span className="text-right font-medium">
              {appointment.staffName ?? '—'}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Tarih / Saat</span>
            <span className="text-right font-medium">
              {formatDateTimeRange(appointment.startTime, appointment.endTime)}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Fiyat</span>
            <span className="text-right font-medium">
              {formatPrice(appointment.priceSnapshot, appointment.currency)}
            </span>
          </div>
          {appointment.notes && (
            <div className="space-y-1">
              <span className="text-muted-foreground">Notlar</span>
              <p className="rounded-md bg-muted/50 p-2">{appointment.notes}</p>
            </div>
          )}
          {appointment.cancellationReason && (
            <div className="space-y-1">
              <span className="text-muted-foreground">İptal nedeni</span>
              <p className="rounded-md bg-muted/50 p-2">
                {appointment.cancellationReason}
              </p>
            </div>
          )}
        </div>

        {showCancelForm && (
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">İptal nedeni (opsiyonel)</Label>
            <Textarea
              id="cancel-reason"
              rows={3}
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              disabled={isActionPending}
            />
          </div>
        )}

        <DialogFooter className="flex-wrap gap-2 sm:justify-start">
          {appointment.status === 'PENDING' && (
            <>
              <Button
                type="button"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isActionPending || !businessId}
                onClick={() => actionMutation.mutate('confirm')}
              >
                Onayla
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isActionPending || !businessId}
                onClick={() => {
                  if (!showCancelForm) {
                    setShowCancelForm(true);
                    return;
                  }
                  actionMutation.mutate('cancel');
                }}
              >
                {showCancelForm ? 'İptali Onayla' : 'İptal Et'}
              </Button>
            </>
          )}

          {appointment.status === 'CONFIRMED' && (
            <>
              <Button
                type="button"
                className="bg-green-600 hover:bg-green-700"
                disabled={isActionPending || !businessId}
                onClick={() => actionMutation.mutate('complete')}
              >
                Tamamlandı
              </Button>
              <Button
                type="button"
                className="bg-purple-600 hover:bg-purple-700"
                disabled={isActionPending || !businessId}
                onClick={() => actionMutation.mutate('no-show')}
              >
                No-Show
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isActionPending || !businessId}
                onClick={() => {
                  if (!showCancelForm) {
                    setShowCancelForm(true);
                    return;
                  }
                  actionMutation.mutate('cancel');
                }}
              >
                {showCancelForm ? 'İptali Onayla' : 'İptal Et'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const columnHelper = createColumnHelper<AppointmentSummary>();

export default function BusinessAppointmentsPage() {
  const queryClient = useQueryClient();
  const today = getTodayDateString();

  const { business, isLoading: isBusinessLoading, isError: isBusinessError, error: businessError } =
    useMyBusiness();

  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [calendarRange, setCalendarRange] = useState<{
    startDate: string;
    endDate: string;
  } | null>(null);
  const [listStartDate, setListStartDate] = useState(today);
  const [listEndDate, setListEndDate] = useState(today);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentSummary | null>(null);

  const queryParams = useMemo((): GetBusinessAppointmentsParams | undefined => {
    if (!business?.id) {
      return undefined;
    }

    if (viewMode === 'calendar') {
      if (!calendarRange) {
        return undefined;
      }
      return {
        startDate: calendarRange.startDate,
        endDate: calendarRange.endDate,
      };
    }

    return {
      startDate: listStartDate,
      endDate: listEndDate,
      status: getApiStatusFilter(statusFilter),
    };
  }, [business?.id, viewMode, calendarRange, listStartDate, listEndDate, statusFilter]);

  const appointmentsQuery = useQuery({
    queryKey: ['businessAppointments', business?.id, queryParams, viewMode],
    queryFn: () => getBusinessAppointments(business!.id, queryParams),
    enabled: Boolean(business?.id && queryParams),
  });

  const filteredAppointments = useMemo(() => {
    const appointments = extractArray<AppointmentSummary>(
      appointmentsQuery.data?.data,
    );
    if (viewMode !== 'list' || statusFilter !== 'cancelled') {
      return appointments;
    }
    return appointments.filter(
      (item) =>
        item.status === 'CANCELLED_BY_USER' ||
        item.status === 'CANCELLED_BY_BUSINESS',
    );
  }, [appointmentsQuery.data?.data, viewMode, statusFilter]);

  const calendarEvents = useMemo((): EventInput[] => {
    return filteredAppointments.map((appointment) => ({
      id: appointment.id,
      title: `${appointment.customerName} — ${appointment.serviceName}`,
      start: appointment.startTime,
      end: appointment.endTime,
      backgroundColor: EVENT_STATUS_COLORS[appointment.status],
      borderColor: EVENT_STATUS_COLORS[appointment.status],
      extendedProps: {
        appointment,
      } satisfies CalendarEventExtendedProps,
    }));
  }, [filteredAppointments]);

  const invalidateAppointments = () => {
    if (business?.id) {
      void queryClient.invalidateQueries({
        queryKey: ['businessAppointments', business.id],
      });
    }
  };

  const handleDatesSet = (arg: DatesSetArg) => {
    const endDate = new Date(arg.end);
    endDate.setDate(endDate.getDate() - 1);
    setCalendarRange({
      startDate: formatDateToYmd(arg.start),
      endDate: formatDateToYmd(endDate),
    });
  };

  const handleEventClick = (arg: EventClickArg) => {
    const props = arg.event.extendedProps as CalendarEventExtendedProps;
    setSelectedAppointment(props.appointment);
  };

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'datetime',
        header: 'Tarih/Saat',
        cell: ({ row }) =>
          formatDateTimeRange(row.original.startTime, row.original.endTime),
      }),
      columnHelper.accessor('customerName', { header: 'Müşteri' }),
      columnHelper.accessor('serviceName', { header: 'Hizmet' }),
      columnHelper.accessor('staffName', {
        header: 'Personel',
        cell: ({ getValue }) => getValue() ?? '—',
      }),
      columnHelper.accessor('status', {
        header: 'Durum',
        cell: ({ getValue }) => <StatusBadge status={getValue()} />,
      }),
      columnHelper.display({
        id: 'price',
        header: 'Fiyat',
        cell: ({ row }) =>
          formatPrice(row.original.priceSnapshot, row.original.currency),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'İşlemler',
        cell: ({ row }) => (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSelectedAppointment(row.original)}
          >
            Detay
          </Button>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: filteredAppointments,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Randevular</h1>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            onClick={() => setViewMode('calendar')}
          >
            Takvim Görünümü
          </Button>
          <Button
            type="button"
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
          >
            Liste Görünümü
          </Button>
        </div>
      </div>

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
          {viewMode === 'calendar' && (
            <Card>
              <CardContent className="pt-6">
                {appointmentsQuery.isLoading && (
                  <LoadingSpinner label="Randevular yükleniyor..." />
                )}

                {appointmentsQuery.isError && (
                  <p className="mb-4 text-sm text-destructive" role="alert">
                    {getErrorMessage(
                      appointmentsQuery.error,
                      'Randevular yüklenirken bir hata oluştu.',
                    )}
                  </p>
                )}

                <div className={cn(appointmentsQuery.isLoading && 'hidden')}>
                  <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="timeGridWeek"
                    locale={trLocale}
                    headerToolbar={{
                      left: 'prev,next today',
                      center: 'title',
                      right: 'dayGridMonth,timeGridWeek,timeGridDay',
                    }}
                    height={720}
                    events={calendarEvents}
                    datesSet={handleDatesSet}
                    eventClick={handleEventClick}
                    slotMinTime="08:00:00"
                    slotMaxTime="22:00:00"
                    allDaySlot={false}
                    nowIndicator
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {viewMode === 'list' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2">
                  <Label htmlFor="list-start-date">Başlangıç</Label>
                  <Input
                    id="list-start-date"
                    type="date"
                    value={listStartDate}
                    onChange={(event) => setListStartDate(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="list-end-date">Bitiş</Label>
                  <Input
                    id="list-end-date"
                    type="date"
                    value={listEndDate}
                    onChange={(event) => setListEndDate(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Durum</Label>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) =>
                      setStatusFilter(value as StatusFilter)
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Durum seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="pending">Bekleyen</SelectItem>
                      <SelectItem value="confirmed">Onaylı</SelectItem>
                      <SelectItem value="completed">Tamamlanan</SelectItem>
                      <SelectItem value="cancelled">İptal</SelectItem>
                      <SelectItem value="no-show">No-Show</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Card>
                <CardContent className="p-0">
                  {appointmentsQuery.isLoading && (
                    <LoadingSpinner label="Randevular yükleniyor..." />
                  )}

                  {appointmentsQuery.isError && (
                    <p className="p-6 text-sm text-destructive" role="alert">
                      {getErrorMessage(
                        appointmentsQuery.error,
                        'Randevular yüklenirken bir hata oluştu.',
                      )}
                    </p>
                  )}

                  {!appointmentsQuery.isLoading &&
                    !appointmentsQuery.isError &&
                    filteredAppointments.length === 0 && (
                      <p className="py-12 text-center text-sm text-muted-foreground">
                        Seçilen kriterlere uygun randevu bulunmuyor.
                      </p>
                    )}

                  {!appointmentsQuery.isLoading &&
                    !appointmentsQuery.isError &&
                    filteredAppointments.length > 0 && (
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
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext(),
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                </CardContent>
              </Card>
            </div>
          )}

          <AppointmentDetailDialog
            appointment={selectedAppointment}
            open={selectedAppointment !== null}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedAppointment(null);
              }
            }}
            businessId={business.id}
            onActionComplete={invalidateAppointments}
          />
        </>
      )}
    </div>
  );
}
