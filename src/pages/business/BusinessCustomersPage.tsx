// Bu dosya, randevu geçmişinden türetilmiş müşteri listesini gösterir.
// Backend'de ayrı bir müşteri endpoint'i olmadığından, mevcut randevu verilerinden
// client-side olarak benzersiz müşteri listesi oluşturulur.
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Phone, Search, User } from 'lucide-react';
import { extractArray } from '@/api/axios';
import { getBusinessAppointments } from '@/api/business';
import { useMyBusiness } from '@/hooks/useMyBusiness';
import { getTodayDateString, toRangeEnd, toRangeStart } from '@/lib/dateUtils';
import type { ApiError } from '@/types';
import type { AppointmentSummary } from '@/types/business';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/** Türetilmiş müşteri özeti */
interface CustomerSummary {
  customerId: string;
  name: string;
  phone?: string;
  appointmentCount: number;
  lastAppointmentDate: string; // ISO string
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-violet-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
    'bg-pink-500',
    'bg-indigo-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
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

/** Randevu listesinden benzersiz müşteri özetleri türetir */
function deriveCustomers(appointments: AppointmentSummary[]): CustomerSummary[] {
  const map = new Map<string, CustomerSummary>();

  for (const appt of appointments) {
    const key = appt.customerId;
    const existing = map.get(key);
    if (existing) {
      existing.appointmentCount += 1;
      if (appt.startTime > existing.lastAppointmentDate) {
        existing.lastAppointmentDate = appt.startTime;
      }
      if (!existing.phone && appt.customerPhone) {
        existing.phone = appt.customerPhone;
      }
    } else {
      map.set(key, {
        customerId: appt.customerId,
        name: appt.customerName,
        phone: appt.customerPhone,
        appointmentCount: 1,
        lastAppointmentDate: appt.startTime,
      });
    }
  }

  // Son randevu tarihine göre azalan sıralama
  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(b.lastAppointmentDate).getTime() -
      new Date(a.lastAppointmentDate).getTime(),
  );
}

function CustomerCard({ customer }: { customer: CustomerSummary }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex items-center gap-4 p-4">
        {/* Avatar */}
        <div
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white',
            getAvatarColor(customer.name),
          )}
        >
          {getInitials(customer.name)}
        </div>

        {/* Bilgiler */}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{customer.name}</p>
          {customer.phone ? (
            <a
              href={`tel:${customer.phone}`}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
            >
              <Phone className="size-3 shrink-0" />
              <span>{customer.phone}</span>
            </a>
          ) : (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <Phone className="size-3 shrink-0 opacity-40" />
              <span>Telefon yok</span>
            </p>
          )}
          <p className="mt-0.5 text-xs text-muted-foreground">
            Son randevu: {formatDate(customer.lastAppointmentDate)}
          </p>
        </div>

        {/* Randevu sayısı */}
        <div className="shrink-0 text-right">
          <p className="text-2xl font-bold">{customer.appointmentCount}</p>
          <p className="text-xs text-muted-foreground">randevu</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Son 90 günlük aralık için tarih üretici
function getLast90DaysRange(): { rangeStart: string; rangeEnd: string } {
  const today = getTodayDateString();
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const startYear = ninetyDaysAgo.getFullYear();
  const startMonth = String(ninetyDaysAgo.getMonth() + 1).padStart(2, '0');
  const startDay = String(ninetyDaysAgo.getDate()).padStart(2, '0');
  const startDate = `${startYear}-${startMonth}-${startDay}`;

  return {
    rangeStart: toRangeStart(startDate),
    rangeEnd: toRangeEnd(today),
  };
}

export default function BusinessCustomersPage() {
  const { business, isLoading: isBusinessLoading, isError: isBusinessError, error: businessError } =
    useMyBusiness();

  const [searchQuery, setSearchQuery] = useState('');
  const range = useMemo(() => getLast90DaysRange(), []);

  const appointmentsQuery = useQuery({
    queryKey: ['businessAppointments', business?.id, 'customers-90d'],
    queryFn: () =>
      getBusinessAppointments(business!.id, {
        rangeStart: range.rangeStart,
        rangeEnd: range.rangeEnd,
      }),
    enabled: Boolean(business?.id),
  });

  const customers = useMemo(() => {
    const appointments = extractArray<AppointmentSummary>(
      appointmentsQuery.data?.data,
    );
    return deriveCustomers(appointments);
  }, [appointmentsQuery.data?.data]);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.trim().toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)),
    );
  }, [customers, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Müşteriler</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Son 90 günlük randevu geçmişinden türetilmiştir
          </p>
        </div>
        {customers.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5">
            <User className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">{customers.length} müşteri</span>
          </div>
        )}
      </div>

      {isBusinessLoading && <LoadingSpinner label="İşletme bilgisi yükleniyor..." />}

      {isBusinessError && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {getErrorMessage(businessError, 'İşletme bilgisi yüklenirken bir hata oluştu.')}
        </div>
      )}

      {business && !isBusinessLoading && (
        <>
          {/* Arama */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="customer-search"
              type="search"
              placeholder="İsim veya telefon ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {appointmentsQuery.isLoading && (
            <LoadingSpinner label="Müşteri verisi yükleniyor..." />
          )}

          {appointmentsQuery.isError && (
            <div
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {getErrorMessage(
                appointmentsQuery.error,
                'Müşteri verisi yüklenirken bir hata oluştu.',
              )}
            </div>
          )}

          {!appointmentsQuery.isLoading && !appointmentsQuery.isError && (
            <>
              {filteredCustomers.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <User className="size-12 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? 'Arama kriterine uygun müşteri bulunamadı.'
                      : 'Son 90 günde henüz randevu alınmamış.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCustomers.map((customer) => (
                    <CustomerCard key={customer.customerId} customer={customer} />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
