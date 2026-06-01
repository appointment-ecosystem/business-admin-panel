// Bu dosya, işletme çalışma saatleri ve tatil günleri yönetim sayfasını içerir.
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import {
  createHoliday,
  deleteHoliday,
  getHolidays,
  getWorkingHours,
  updateWorkingHours,
} from '@/api/business';
import { extractArray } from '@/api/axios';
import { useMyBusiness } from '@/hooks/useMyBusiness';
import type { ApiError } from '@/types';
import type { Holiday, WorkingHour, WorkingHourRequest } from '@/types/business';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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

const DAY_LABELS: Record<number, string> = {
  1: 'Pazartesi',
  2: 'Salı',
  3: 'Çarşamba',
  4: 'Perşembe',
  5: 'Cuma',
  6: 'Cumartesi',
  7: 'Pazar',
};

type DaySchedule = WorkingHourRequest;

function createDefaultWeekSchedule(): DaySchedule[] {
  return Array.from({ length: 7 }, (_, index) => ({
    dayOfWeek: index + 1,
    openTime: '09:00',
    closeTime: '18:00',
    isClosed: true,
  }));
}

function mergeWithApiSchedule(apiHours: DaySchedule[]): DaySchedule[] {
  const defaults = createDefaultWeekSchedule();
  return defaults.map((defaultDay) => {
    const fromApi = apiHours.find(
      (hour) => hour.dayOfWeek === defaultDay.dayOfWeek,
    );
    if (!fromApi) {
      return defaultDay;
    }
    return {
      dayOfWeek: fromApi.dayOfWeek,
      openTime: fromApi.openTime || defaultDay.openTime,
      closeTime: fromApi.closeTime || defaultDay.closeTime,
      isClosed: fromApi.isClosed,
    };
  });
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

function formatHolidayDate(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  });
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

export default function BusinessWorkingHoursPage() {
  const queryClient = useQueryClient();
  const { business, isLoading: isBusinessLoading, isError: isBusinessError, error: businessError } =
    useMyBusiness();

  const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>(
    createDefaultWeekSchedule(),
  );
  const [scheduleInitialized, setScheduleInitialized] = useState(false);

  const [holidayDate, setHolidayDate] = useState('');
  const [holidayReason, setHolidayReason] = useState('');
  const [holidayToDelete, setHolidayToDelete] = useState<Holiday | null>(null);

  const workingHoursQuery = useQuery({
    queryKey: ['workingHours', business?.id],
    queryFn: () => getWorkingHours(business!.id),
    enabled: Boolean(business?.id),
  });

  const holidaysQuery = useQuery({
    queryKey: ['holidays', business?.id],
    queryFn: () => getHolidays(business!.id),
    enabled: Boolean(business?.id),
  });

  useEffect(() => {
    const workingHours = extractArray<WorkingHour>(workingHoursQuery.data?.data);
    if (workingHours.length === 0 || scheduleInitialized) {
      return;
    }

    const mapped = workingHours.map((hour) => ({
      dayOfWeek: hour.dayOfWeek,
      openTime: hour.openTime,
      closeTime: hour.closeTime,
      isClosed: hour.isClosed,
    }));

    setWeekSchedule(mergeWithApiSchedule(mapped));
    setScheduleInitialized(true);
  }, [workingHoursQuery.data?.data, scheduleInitialized]);

  useEffect(() => {
    if (
      workingHoursQuery.isSuccess &&
      extractArray<WorkingHour>(workingHoursQuery.data?.data).length === 0 &&
      !scheduleInitialized
    ) {
      setWeekSchedule(createDefaultWeekSchedule());
      setScheduleInitialized(true);
    }
  }, [workingHoursQuery.isSuccess, workingHoursQuery.data?.data, scheduleInitialized]);

  const invalidateWorkingHours = () => {
    if (business?.id) {
      void queryClient.invalidateQueries({
        queryKey: ['workingHours', business.id],
      });
    }
  };

  const invalidateHolidays = () => {
    if (business?.id) {
      void queryClient.invalidateQueries({
        queryKey: ['holidays', business.id],
      });
    }
  };

  const saveHoursMutation = useMutation({
    mutationFn: () => {
      if (!business?.id) {
        throw new Error('İşletme bilgisi bulunamadı.');
      }
      return updateWorkingHours(business.id, weekSchedule);
    },
    onSuccess: () => {
      toast.success('Çalışma saatleri güncellendi');
      setScheduleInitialized(false);
      invalidateWorkingHours();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Çalışma saatleri güncellenemedi.'));
    },
  });

  const createHolidayMutation = useMutation({
    mutationFn: () => {
      if (!business?.id) {
        throw new Error('İşletme bilgisi bulunamadı.');
      }
      if (!holidayDate) {
        throw new Error('Tarih seçiniz.');
      }
      return createHoliday(business.id, {
        date: holidayDate,
        reason: holidayReason.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Tatil günü eklendi');
      setHolidayDate('');
      setHolidayReason('');
      invalidateHolidays();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Tatil günü eklenemedi.'));
    },
  });

  const deleteHolidayMutation = useMutation({
    mutationFn: (holidayId: string) => {
      if (!business?.id) {
        throw new Error('İşletme bilgisi bulunamadı.');
      }
      return deleteHoliday(business.id, holidayId);
    },
    onSuccess: () => {
      toast.success('Tatil günü silindi');
      setHolidayToDelete(null);
      invalidateHolidays();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Tatil günü silinemedi.'));
    },
  });

  const updateDay = (
    dayOfWeek: number,
    patch: Partial<Pick<DaySchedule, 'openTime' | 'closeTime' | 'isClosed'>>,
  ) => {
    setWeekSchedule((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, ...patch } : day,
      ),
    );
  };

  const holidays = extractArray<Holiday>(holidaysQuery.data?.data);
  const isHoursLoading =
    isBusinessLoading || (workingHoursQuery.isLoading && !scheduleInitialized);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Çalışma Saatleri</h1>

      {isBusinessError && (
        <p className="text-sm text-destructive" role="alert">
          {getErrorMessage(
            businessError,
            'İşletme bilgisi yüklenirken bir hata oluştu.',
          )}
        </p>
      )}

      {business && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Haftalık Çalışma Saatleri</CardTitle>
              <CardDescription>
                Her gün için açılış/kapanış saatlerini veya kapalı durumunu
                belirleyin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isHoursLoading && (
                <LoadingSpinner label="Çalışma saatleri yükleniyor..." />
              )}

              {workingHoursQuery.isError && (
                <p className="text-sm text-destructive" role="alert">
                  {getErrorMessage(
                    workingHoursQuery.error,
                    'Çalışma saatleri yüklenirken bir hata oluştu.',
                  )}
                </p>
              )}

              {!isHoursLoading && !workingHoursQuery.isError && (
                <>
                  <div className="overflow-hidden rounded-lg border">
                    <div className="grid grid-cols-[140px_100px_1fr_1fr] gap-4 border-b bg-muted/40 px-4 py-2 text-sm font-medium text-muted-foreground">
                      <span>Gün</span>
                      <span>Kapalı</span>
                      <span>Açılış</span>
                      <span>Kapanış</span>
                    </div>
                    {weekSchedule.map((day) => (
                      <div
                        key={day.dayOfWeek}
                        className="grid grid-cols-[140px_100px_1fr_1fr] items-center gap-4 border-b px-4 py-3 last:border-b-0"
                      >
                        <span className="font-medium">
                          {DAY_LABELS[day.dayOfWeek]}
                        </span>
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`closed-${day.dayOfWeek}`}
                            checked={day.isClosed}
                            onCheckedChange={(checked) =>
                              updateDay(day.dayOfWeek, { isClosed: checked })
                            }
                            disabled={saveHoursMutation.isPending}
                          />
                          <Label
                            htmlFor={`closed-${day.dayOfWeek}`}
                            className="text-sm text-muted-foreground"
                          >
                            Kapalı
                          </Label>
                        </div>
                        <Input
                          type="time"
                          value={day.openTime}
                          disabled={day.isClosed || saveHoursMutation.isPending}
                          className={cn(day.isClosed && 'opacity-50')}
                          onChange={(event) =>
                            updateDay(day.dayOfWeek, {
                              openTime: event.target.value,
                            })
                          }
                        />
                        <Input
                          type="time"
                          value={day.closeTime}
                          disabled={day.isClosed || saveHoursMutation.isPending}
                          className={cn(day.isClosed && 'opacity-50')}
                          onChange={(event) =>
                            updateDay(day.dayOfWeek, {
                              closeTime: event.target.value,
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    onClick={() => saveHoursMutation.mutate()}
                    disabled={saveHoursMutation.isPending}
                  >
                    {saveHoursMutation.isPending
                      ? 'Kaydediliyor...'
                      : 'Kaydet'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tatil Günleri</CardTitle>
              <CardDescription>
                İşletmenizin kapalı olduğu özel günleri tanımlayın.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {holidaysQuery.isLoading && (
                <LoadingSpinner label="Tatiller yükleniyor..." />
              )}

              {holidaysQuery.isError && (
                <p className="text-sm text-destructive" role="alert">
                  {getErrorMessage(
                    holidaysQuery.error,
                    'Tatiller yüklenirken bir hata oluştu.',
                  )}
                </p>
              )}

              {!holidaysQuery.isLoading && !holidaysQuery.isError && (
                <>
                  {holidays.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Tatil günü tanımlanmamış.
                    </p>
                  ) : (
                    <ul className="divide-y rounded-lg border">
                      {holidays.map((holiday) => (
                        <li
                          key={holiday.id}
                          className="flex items-center justify-between gap-4 px-4 py-3"
                        >
                          <div>
                            <p className="font-medium">
                              {formatHolidayDate(holiday.date)}
                            </p>
                            {holiday.reason && (
                              <p className="text-sm text-muted-foreground">
                                {holiday.reason}
                              </p>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => setHolidayToDelete(holiday)}
                          >
                            Sil
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="flex flex-wrap items-end gap-3 border-t pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="holiday-date">Tarih</Label>
                      <Input
                        id="holiday-date"
                        type="date"
                        value={holidayDate}
                        onChange={(event) => setHolidayDate(event.target.value)}
                        disabled={createHolidayMutation.isPending}
                      />
                    </div>
                    <div className="min-w-[240px] flex-1 space-y-2">
                      <Label htmlFor="holiday-reason">Açıklama</Label>
                      <Input
                        id="holiday-reason"
                        placeholder="Opsiyonel"
                        value={holidayReason}
                        onChange={(event) =>
                          setHolidayReason(event.target.value)
                        }
                        disabled={createHolidayMutation.isPending}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() => createHolidayMutation.mutate()}
                      disabled={
                        createHolidayMutation.isPending || !holidayDate
                      }
                    >
                      {createHolidayMutation.isPending ? 'Ekleniyor...' : 'Ekle'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <AlertDialog
        open={holidayToDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setHolidayToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tatil gününü sil</AlertDialogTitle>
            <AlertDialogDescription>
              {holidayToDelete
                ? `${formatHolidayDate(holidayToDelete.date)} tarihli tatili silmek istediğinize emin misiniz?`
                : 'Bu tatil gününü silmek istediğinize emin misiniz?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteHolidayMutation.isPending}
              onClick={() => {
                if (holidayToDelete) {
                  deleteHolidayMutation.mutate(holidayToDelete.id);
                }
              }}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
