import { describe, expect, it } from 'vitest';
import type { DayClosing, Expense, Order, PaymentType, Refund } from '../types';
import { buildClosingText, buildDrawer, describeDifference, isClosingStale } from './cashDrawer';

const sale = (id: string, status: Order['status'], total: number, type: PaymentType, method: string): Order =>
  ({
    id,
    status,
    totals: { grandTotal: total, itemDiscountTotal: 0, orderDiscountTotal: 0, serviceTotal: 0, taxTotal: 0 },
    items: [],
    payments: [{ paymentMethodId: `m-${method}`, methodNameSnapshot: method, methodType: type, amount: total }],
  } as unknown as Order);
const refund = (orderId: string, amount: number, kind: Refund['kind'] = 'refund'): Refund => ({ orderId, amount, kind } as Refund);
const expense = (amount: number, isFromDrawer: boolean, deletedAt?: string): Expense => ({ amount, isFromDrawer, ...(deletedAt ? { deletedAt } : {}) } as Expense);

const sales = [
  sale('a', 'paid', 50_000, 'cash', 'Tunai'),
  sale('b', 'partial_refund', 30_000, 'cash', 'Tunai'),
  sale('c', 'paid', 40_000, 'qris', 'QRIS'),
  sale('d', 'void', 99_000, 'cash', 'Tunai'), // money handed back: not in the drawer
];
const yesterdayQris = sale('y', 'refunded', 25_000, 'qris', 'QRIS');

const input = {
  openingCash: 200_000,
  sales,
  refunds: [refund('b', 10_000), refund('y', 25_000), refund('d', 99_000, 'void')],
  ordersById: new Map([...sales, yesterdayQris].map((o) => [o.id, o])),
  expenses: [expense(35_000, true), expense(150_000, false), expense(7_000, true, '2026-11-19T10:00:00Z')],
  openOrders: [{ totals: { grandTotal: 45_000 } } as Order],
};

describe('buildDrawer', () => {
  it('expected cash = opening + cash sales − cash refunds − drawer expenses', () => {
    const drawer = buildDrawer(input);
    expect(drawer).toMatchObject({ cashSales: 80_000, cashRefunds: 10_000, drawerExpenses: 35_000, expectedCash: 235_000 });
    expect(drawer.expectedCash).toBe(drawer.openingCash + drawer.cashSales - drawer.cashRefunds - drawer.drawerExpenses);
  });

  it('reports sales, expenses, per-method money (net of refunds) and unpaid orders', () => {
    const drawer = buildDrawer(input);
    expect(drawer).toMatchObject({ netSales: 85_000, transactions: 3, expensesTotal: 185_000, openOrderCount: 1, openOrderAmount: 45_000 });
    expect(drawer.byMethod).toEqual([
      { name: 'Tunai', type: 'cash', amount: 70_000 },
      { name: 'QRIS', type: 'qris', amount: 15_000 },
    ]);
  });

  it('an empty day is just the opening cash', () => {
    expect(buildDrawer({ ...input, sales: [], refunds: [], expenses: [], openOrders: [] })).toMatchObject({ expectedCash: 200_000, netSales: 0, byMethod: [] });
  });
});

describe('closing helpers', () => {
  const closing = {
    ...buildDrawer(input),
    businessDate: '2026-11-19',
    countedCash: 230_000,
    difference: -5_000,
    note: 'Uang kembalian kurang',
    closedAt: '2026-11-19T14:30:00Z',
  } as DayClosing;

  it('describes the difference in words', () => {
    expect([describeDifference(0), describeDifference(2_000), describeDifference(-5_000)]).toEqual(['pas', 'lebih Rp2.000', 'kurang Rp5.000']);
  });

  it('detects changes after closing', () => {
    expect(isClosingStale(closing, buildDrawer(input))).toBe(false);
    expect(isClosingStale(closing, buildDrawer({ ...input, sales: [...sales, sale('e', 'paid', 5_000, 'cash', 'Tunai')] }))).toBe(true);
  });

  it('writes the WhatsApp summary', () => {
    expect(buildClosingText({ storeName: 'Warung Bakso', closing, closedByName: 'Dika', timeZone: 'Asia/Jakarta' })).toBe(
      [
        'Tutup kasir Warung Bakso',
        'Kamis, 19 Nov 2026, ditutup 21.30 oleh Dika',
        '',
        'Penjualan bersih: Rp85.000 (3 transaksi)',
        '- Tunai: Rp70.000',
        '- QRIS: Rp15.000',
        'Pengeluaran: Rp185.000',
        '',
        'Kas laci',
        'Modal awal: Rp200.000',
        'Penjualan tunai: Rp80.000',
        'Refund tunai: -Rp10.000',
        'Pengeluaran dari laci: -Rp35.000',
        'Seharusnya: Rp235.000',
        'Dihitung: Rp230.000',
        'Selisih: kurang Rp5.000',
        '',
        'Belum dibayar: 1 pesanan (Rp45.000)',
        '',
        'Catatan: Uang kembalian kurang',
      ].join('\n'),
    );
  });
});
