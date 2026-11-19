import type { BusinessDate } from '../types';
import { DATE_LOCALE, t } from '../i18n';

const DAY_MS = 86_400_000;

export interface DateRange {
  from: BusinessDate;
  to: BusinessDate;
}

export const RANGE_PRESETS = ['today', 'yesterday', 'last7', 'month', 'custom'] as const;
export type RangePreset = (typeof RANGE_PRESETS)[number];

/** Parses YYYY-MM-DD as a UTC midnight timestamp (no timezone drift). */
function toUtc(date: BusinessDate): number {
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) throw new Error(t('Tanggal tidak valid: {0}', date));
  return Date.UTC(y, m - 1, d);
}

function fromUtc(ms: number): BusinessDate {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(date: BusinessDate, days: number): BusinessDate {
  return fromUtc(toUtc(date) + days * DAY_MS);
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: BusinessDate, to: BusinessDate): number {
  return Math.round((toUtc(to) - toUtc(from)) / DAY_MS);
}

export function presetRange(preset: Exclude<RangePreset, 'custom'>, today: BusinessDate): DateRange {
  switch (preset) {
    case 'today':
      return { from: today, to: today };
    case 'yesterday': {
      const yesterday = addDays(today, -1);
      return { from: yesterday, to: yesterday };
    }
    case 'last7':
      return { from: addDays(today, -6), to: today };
    case 'month':
      return { from: `${today.slice(0, 7)}-01`, to: today };
  }
}

/** Returns an error message, or null when the range is usable. */
export function validateRange(range: DateRange, maxDays: number): string | null {
  const span = daysBetween(range.from, range.to);
  if (span < 0) return t('Tanggal awal harus sebelum tanggal akhir.');
  if (span + 1 > maxDays) return t('Rentang maksimal {0} hari.', maxDays);
  return null;
}

/** Every date in the range, newest first — for grouped lists. */
export function datesInRange(range: DateRange): BusinessDate[] {
  const span = daysBetween(range.from, range.to);
  return Array.from({ length: Math.max(0, span + 1) }, (_, i) => addDays(range.to, -i));
}

const longDate = new Intl.DateTimeFormat(DATE_LOCALE, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const shortDate = new Intl.DateTimeFormat(DATE_LOCALE, { day: 'numeric', month: 'short', timeZone: 'UTC' });

export function formatBusinessDate(date: BusinessDate): string {
  return longDate.format(new Date(toUtc(date)));
}

export function formatRange(range: DateRange): string {
  if (range.from === range.to) return formatBusinessDate(range.from);
  return `${shortDate.format(new Date(toUtc(range.from)))} – ${shortDate.format(new Date(toUtc(range.to)))} ${range.to.slice(0, 4)}`;
}
