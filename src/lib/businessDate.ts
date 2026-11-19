import type { BusinessDate, Store } from '../types';
import { t } from '../i18n';

const RECEIPT_SEQ_DIGITS = 4;

/**
 * Business date in the store's timezone, shifted by the day cut-off.
 * A night seller with cut-off 04:00 who sells at 01:30 on the 19th records it on the 18th.
 */
export function getBusinessDate(at: Date, store: Pick<Store, 'timezone' | 'dayCutoff'>): BusinessDate {
  const [cutHour, cutMinute] = store.dayCutoff.split(':').map(Number);
  const shifted = new Date(at.getTime() - ((cutHour ?? 0) * 60 + (cutMinute ?? 0)) * 60_000);
  // en-CA yields YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: store.timezone }).format(shifted);
}

/** INV-YYYYMMDD-<device 2 chars><seq 4>, e.g. INV-20261118-A10042. */
export function formatReceiptNo(businessDate: BusinessDate, deviceCode: string, seq: number): string {
  if (!/^[A-Z0-9]{2}$/.test(deviceCode)) {
    throw new Error(t('Device code must be 2 uppercase alphanumerics, got "{0}"', deviceCode));
  }
  const compactDate = businessDate.replace(/-/g, '');
  return t('INV-{0}-{1}{2}', compactDate, deviceCode, String(seq).padStart(RECEIPT_SEQ_DIGITS, '0'));
}
