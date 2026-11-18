import { CURRENCY, LOCALE } from '../constants';
import type { Rupiah } from '../types';

const formatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

/** Formats integer Rupiah as "Rp12.500". */
export function formatRupiah(amount: Rupiah): string {
  return formatter.format(amount).replace(/\s/g, '');
}

/** Rounds to whole Rupiah; all stored money must pass through this. */
export function toRupiah(value: number): Rupiah {
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid money value: ${value}`);
  }
  return Math.round(value);
}

/** Parses user input like "12.500" or "12500" into Rupiah. Returns null when invalid. */
export function parseRupiah(input: string): Rupiah | null {
  const digits = input.replace(/[^\d]/g, '');
  if (digits.length === 0) return null;
  const value = Number(digits);
  return Number.isSafeInteger(value) ? value : null;
}
