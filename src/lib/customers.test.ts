import { describe, expect, it } from 'vitest';
import type { Order } from '../types';
import { customerStats, formatPhone, normalizePhone, searchCustomers, toWhatsAppNumber } from './customers';

describe('phone', () => {
  it('normalises every common way of typing an Indonesian mobile number', () => {
    for (const input of ['081234567890', '0812-3456-7890', '+62 812 3456 7890', '6281234567890', '81234567890']) {
      expect(normalizePhone(input)).toBe('+6281234567890');
    }
  });

  it('rejects landlines, short numbers and junk', () => {
    for (const input of ['0215551234', '0812', 'abc', '', '+1 415 555 0100']) expect(normalizePhone(input)).toBeNull();
  });

  it('formats for display and for wa.me', () => {
    expect(formatPhone('+6281234567890')).toBe('0812-3456-7890');
    expect(toWhatsAppNumber('+6281234567890')).toBe('6281234567890');
  });
});

describe('searchCustomers', () => {
  const customers = [
    { name: 'Bu Sari', phone: '+6281234567890' },
    { name: 'Pak Budi', phone: undefined },
    { name: 'Sarinah Catering', phone: '+6285700001111' },
  ];

  it('matches names case-insensitively and phones in local or international form', () => {
    expect(searchCustomers(customers, 'sari').map((c) => c.name)).toEqual(['Bu Sari', 'Sarinah Catering']);
    expect(searchCustomers(customers, '0812').map((c) => c.name)).toEqual(['Bu Sari']);
    expect(searchCustomers(customers, '62857').map((c) => c.name)).toEqual(['Sarinah Catering']);
    expect(searchCustomers(customers, '  ')).toHaveLength(3);
    expect(searchCustomers(customers, '12')).toHaveLength(0); // too short to be a phone search
  });

  it('searches 5 000 customers well under 300 ms (PRD M7)', () => {
    const many = Array.from({ length: 5_000 }, (_, i) => ({ name: `Pelanggan ${i}`, phone: `+62812${String(i).padStart(8, '0')}` }));
    const start = performance.now();
    const byName = searchCustomers(many, 'pelanggan 49');
    const byPhone = searchCustomers(many, '081200004999');
    expect(performance.now() - start).toBeLessThan(300);
    expect(byName.length).toBe(111);
    expect(byPhone).toHaveLength(1);
  });
});

describe('customerStats', () => {
  const order = (customerId: string | null, status: Order['status'], total: number, paidAt: string): Order =>
    ({ customerId, status, totals: { grandTotal: total }, paidAt, updatedAt: paidAt } as unknown as Order);

  it('counts completed sales, ignores voids, and tracks open orders and the last visit', () => {
    const stats = customerStats([
      order('a', 'paid', 20_000, '2026-11-17T05:00:00Z'),
      order('a', 'partial_refund', 10_000, '2026-11-18T05:00:00Z'),
      order('a', 'void', 99_000, '2026-11-18T06:00:00Z'),
      order('a', 'open', 5_000, '2026-11-18T07:00:00Z'),
      order(null, 'paid', 7_000, '2026-11-18T08:00:00Z'),
    ]);
    expect(stats.get('a')).toEqual({ visits: 2, totalSpend: 30_000, lastVisitAt: '2026-11-18T05:00:00Z', openOrders: 1 });
    expect(stats.size).toBe(1);
  });
});
