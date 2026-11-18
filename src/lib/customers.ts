import type { Customer, Id, Order } from '../types';
import { isCountedSale } from './reports';

/** Customer helpers (ADR-005). Phones are stored canonically as `+628…`. */
const CANONICAL_PHONE = /^\+628\d{7,12}$/;

/** Accepts `0812…`, `62812…`, `+62 812-…`, `812…`; returns `+628…` or null when it is not an Indonesian mobile number. */
export function normalizePhone(input: string): string | null {
  const compact = input.replace(/[^\d+]/g, '');
  let rest: string;
  if (compact.startsWith('+62')) rest = compact.slice(3);
  else if (compact.startsWith('62')) rest = compact.slice(2);
  else if (compact.startsWith('0')) rest = compact.slice(1);
  else if (compact.startsWith('8')) rest = compact;
  else return null;
  const canonical = `+62${rest}`;
  return CANONICAL_PHONE.test(canonical) ? canonical : null;
}

/** `+6281234567890` → `0812-3456-7890` (how people read numbers aloud). */
export function formatPhone(phone: string): string {
  return `0${phone.slice(3)}`.replace(/^(\d{4})(\d{4})(\d+)$/, '$1-$2-$3');
}

/** Number part for `https://wa.me/<number>`. */
export const toWhatsAppNumber = (phone: string): string => phone.replace(/\D/g, '');

const MIN_PHONE_QUERY_DIGITS = 3;

/** Matches name (case-insensitive substring) or phone digits typed in any common form. */
export function searchCustomers<T extends Pick<Customer, 'name' | 'phone'>>(customers: readonly T[], query: string): T[] {
  const text = query.trim().toLowerCase();
  if (text === '') return [...customers];
  const digits = text.replace(/\D/g, '');
  const phoneQuery = digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
  const canMatchPhone = digits.length >= MIN_PHONE_QUERY_DIGITS;
  return customers.filter(
    (c) => c.name.toLowerCase().includes(text) || (canMatchPhone && c.phone !== undefined && toWhatsAppNumber(c.phone).includes(phoneQuery)),
  );
}

export interface CustomerStats {
  visits: number;
  /** Gross of completed sales (refunds are shown on the orders themselves). */
  totalSpend: number;
  lastVisitAt: string | null;
  openOrders: number;
}

export const NO_STATS: CustomerStats = { visits: 0, totalSpend: 0, lastVisitAt: null, openOrders: 0 };

export function customerStats(orders: readonly Order[]): Map<Id, CustomerStats> {
  const stats = new Map<Id, CustomerStats>();
  for (const order of orders) {
    if (!order.customerId) continue;
    const current = stats.get(order.customerId) ?? NO_STATS;
    if (order.status === 'open') {
      stats.set(order.customerId, { ...current, openOrders: current.openOrders + 1 });
    } else if (isCountedSale(order)) {
      const paidAt = order.paidAt ?? order.updatedAt;
      stats.set(order.customerId, {
        ...current,
        visits: current.visits + 1,
        totalSpend: current.totalSpend + order.totals.grandTotal,
        lastVisitAt: current.lastVisitAt && current.lastVisitAt > paidAt ? current.lastVisitAt : paidAt,
      });
    }
  }
  return stats;
}
