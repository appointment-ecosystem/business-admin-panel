// Bu dosya, tarih dizelerini backend'in beklediği ISO-8601 OffsetDateTime formatına çeviren yardımcı fonksiyonları içerir.
// Backend: rangeStart / rangeEnd parametreleri zorunlu, OffsetDateTime formatı (örn. 2026-06-25T00:00:00+03:00)

/**
 * Tarayıcının yerel UTC offset'ini +HH:MM formatında döndürür.
 * Örn: +03:00, -05:00, +00:00
 */
function getLocalOffsetString(): string {
  const offsetMinutes = new Date().getTimezoneOffset(); // negatif sayı = UTC+'nın doğusu
  const sign = offsetMinutes <= 0 ? '+' : '-';
  const absMinutes = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absMinutes / 60)).padStart(2, '0');
  const mins = String(absMinutes % 60).padStart(2, '0');
  return `${sign}${hours}:${mins}`;
}

/**
 * 'YYYY-MM-DD' formatındaki tarih dizesini günün başlangıcına (00:00:00)
 * OffsetDateTime formatına çevirir.
 * Örn: '2026-06-25' → '2026-06-25T00:00:00+03:00'
 */
export function toRangeStart(dateStr: string): string {
  return `${dateStr}T00:00:00${getLocalOffsetString()}`;
}

/**
 * 'YYYY-MM-DD' formatındaki tarih dizesini günün sonuna (23:59:59)
 * OffsetDateTime formatına çevirir.
 * Örn: '2026-06-25' → '2026-06-25T23:59:59+03:00'
 */
export function toRangeEnd(dateStr: string): string {
  return `${dateStr}T23:59:59${getLocalOffsetString()}`;
}

/**
 * Bugünün tarihini 'YYYY-MM-DD' formatında döndürür.
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Date nesnesini 'YYYY-MM-DD' formatına çevirir.
 */
export function formatDateToYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
