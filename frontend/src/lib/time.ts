/**
 * All timestamps are stored in UTC (`timestamptz`); this module is the single place
 * that decides how they are shown. Override with NEXT_PUBLIC_APP_TIMEZONE if the
 * business moves out of Pakistan.
 */
export const APP_TIMEZONE = process.env.NEXT_PUBLIC_APP_TIMEZONE?.trim() || 'Asia/Karachi';

const LOCALE = 'en-US';

function dateTimeFormat(options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(LOCALE, { ...options, timeZone: APP_TIMEZONE });
}

/** "12 Oct 2026, 09:45" in business-local time. */
export function formatDateTime(value: Date | string | number): string {
  return dateTimeFormat({ dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

/** "12/10/2026, 09:45" — same instant, compact enough for dense table cells. */
export function formatDateTimeCompact(value: Date | string | number): string {
  return dateTimeFormat({ dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

/** "12 Oct 2026" in business-local time. */
export function formatDate(value: Date | string | number): string {
  return dateTimeFormat({ dateStyle: 'medium' }).format(new Date(value));
}

/** "09:45" in business-local time. */
export function formatTime(value: Date | string | number): string {
  return dateTimeFormat({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(value));
}

/** "Monday, 12 October 2026" in business-local time. */
export function formatLongDate(value: Date | string | number = new Date()): string {
  return dateTimeFormat({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));
}

/** Unambiguous stamp for printed tickets: "28 Oct 2026, 01:30 PKT". */
export function formatTicketStamp(value: Date | string | number = new Date()): string {
  const stamp = dateTimeFormat({
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(value));
  return `${stamp} ${zoneAbbr()}`;
}

/**
 * The zone abbreviation ("PKT") plus UTC offset, resolved from Intl so the label
 * stays correct if APP_TIMEZONE is overridden.
 */
export function zoneLabel(): string {
  const offset = utcOffsetMinutes();
  const sign = offset < 0 ? '-' : '+';
  const abs = Math.abs(offset);
  return `UTC${sign}${Math.floor(abs / 60)}:${String(abs % 60).padStart(2, '0')}`;
}

function zoneAbbr(): string {
  return APP_TIMEZONE === 'Asia/Karachi' ? 'PKT' : zoneLabel();
}

/** Wall-clock parts of `instant` as seen in APP_TIMEZONE. */
function zoneParts(instant: Date) {
  const parts = dateTimeFormat({
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? '0');
  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: read('hour'),
    minute: read('minute'),
    second: read('second'),
  };
}

/** Offset of APP_TIMEZONE from UTC in minutes at `instant` (rounded to whole minutes). */
export function utcOffsetMinutes(instant: Date = new Date()): number {
  const parts = zoneParts(instant);
  const wallAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return Math.round((wallAsUtc - Math.floor(instant.getTime() / 60_000) * 60_000) / 60_000);
}

/** The UTC instant of business-local midnight on the day that contains `instant`. */
export function localDayStart(instant: Date = new Date()): Date {
  const offsetMs = utcOffsetMinutes(instant) * 60_000;
  const wall = new Date(instant.getTime() + offsetMs);
  const midnightUtc = Date.UTC(wall.getUTCFullYear(), wall.getUTCMonth(), wall.getUTCDate());
  return new Date(midnightUtc - offsetMs);
}

/** "YYYY-MM-DD" for the business-local calendar day of `instant`. */
export function localDayKey(instant: Date = new Date()): string {
  const parts = zoneParts(instant);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

/** Business-local calendar day of `instant`, e.g. "2026" of the current PKT year. */
export function localYear(instant: Date = new Date()): number {
  return zoneParts(instant).year;
}
