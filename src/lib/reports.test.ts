import { describe, expect, it } from 'vitest';
import type { Order, OrderItem, Refund } from '../types';
import { buildReport, summarize } from './reports';

const item = (productId: string, unitPrice: number, qty: number): OrderItem => ({
  id: `${productId}-line`, productId, nameSnapshot: productId, unitPrice, qty, options: [], discount: null, note: '',
});

function order(id: string, opts: { date: string; paidAt: string; status?: Order['status']; method?: string; mode?: string; items: OrderItem[]; discount?: number }): Order {
  const subtotal = opts.items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const discount = opts.discount ?? 0;
  return {
    id, storeId: 's', createdAt: '', updatedAt: '', receiptNo: id, status: opts.status ?? 'paid',
    salesModeId: opts.mode ?? 'dine', salesModeNameSnapshot: opts.mode === 'take' ? 'Takeaway' : 'Dine In',
    customerId: null, label: '', items: opts.items, orderDiscount: null,
    payments: [{ id: 'p', paymentMethodId: opts.method ?? 'cash', methodNameSnapshot: opts.method === 'qris' ? 'QRIS' : 'Tunai', methodType: opts.method === 'qris' ? 'qris' : 'cash', amount: subtotal - discount }],
    totals: { subtotal, itemDiscountTotal: 0, orderDiscountTotal: discount, serviceTotal: 0, taxTotal: 0, grandTotal: subtotal - discount },
    cashierId: 'owner', businessDate: opts.date, openedAt: opts.paidAt, paidAt: opts.paidAt,
  };
}

const refund = (orderId: string, date: string, amount: number, kind: Refund['kind'] = 'refund'): Refund => ({
  id: `r-${orderId}-${date}`, storeId: 's', createdAt: '', updatedAt: '', orderId, businessDate: date, kind, amount,
  items: [], reasonCode: 'customer_cancel', reasonNote: '', actorId: 'owner', approvedById: null,
});

// 2026-11-17 is "yesterday"; 18 is "today". Times are UTC; store is WIB (UTC+7).
const yesterdaySale = order('Y1', { date: '2026-11-17', paidAt: '2026-11-17T05:00:00Z', items: [item('bakso', 15_000, 2)] }); // 12:00 WIB
const todayCash = order('T1', { date: '2026-11-18', paidAt: '2026-11-18T04:30:00Z', items: [item('bakso', 15_000, 1), item('esteh', 5_000, 2)], discount: 2_500 }); // 11:30
const todayQris = order('T2', { date: '2026-11-18', paidAt: '2026-11-18T12:10:00Z', method: 'qris', mode: 'take', items: [item('esteh', 6_000, 3)] }); // 19:10
const todayVoid = order('T3', { date: '2026-11-18', paidAt: '2026-11-18T12:20:00Z', status: 'void', items: [item('kerupuk', 2_000, 5)] });

const members = new Map([['owner', 'Pemilik']]);
const today = { from: '2026-11-18', to: '2026-11-18' };

function reportToday(refunds: Refund[]) {
  const all = [yesterdaySale, todayCash, todayQris, todayVoid];
  return buildReport({
    store: { timezone: 'Asia/Jakarta' },
    range: today,
    sales: [todayCash, todayQris, todayVoid],
    refunds,
    ordersById: new Map(all.map((o) => [o.id, o])),
    memberName: members,
  });
}

describe('buildReport — cash basis (ADR-002)', () => {
  it("subtracts today's refund of yesterday's sale from today, on the original method", () => {
    const report = reportToday([refund('Y1', '2026-11-18', 15_000), refund('T3', '2026-11-18', 10_000, 'void')]);
    expect(report.summary).toMatchObject({
      grossSales: 40_500, // 22.500 + 18.000
      refunds: 15_000, // void record is NOT a cash refund
      netSales: 25_500,
      transactions: 2,
      averageTicket: 20_250,
      discounts: 2_500,
      voidCount: 1,
      voidAmount: 10_000,
      itemsSold: 6,
    });
    const cash = report.byPaymentMethod.find((r) => r.key === 'cash');
    expect(cash).toMatchObject({ transactions: 1, gross: 22_500, refunds: 15_000, net: 7_500 });
    expect(report.byPaymentMethod.find((r) => r.key === 'qris')).toMatchObject({ gross: 18_000, net: 18_000 });
  });

  it('buckets sales by store-local hour and by day', () => {
    const report = reportToday([]);
    expect(report.byHour[11]).toEqual({ hour: 11, transactions: 1, gross: 22_500 });
    expect(report.byHour[19]).toEqual({ hour: 19, transactions: 1, gross: 18_000 });
    expect(report.byHour.reduce((s, h) => s + h.transactions, 0)).toBe(2);
    expect(report.byDay).toEqual([{ date: '2026-11-18', transactions: 2, gross: 40_500, refunds: 0, net: 40_500 }]);
  });

  it('ranks products by revenue and splits sales modes', () => {
    const report = reportToday([]);
    expect(report.products.map((p) => [p.productId, p.qty, p.revenue])).toEqual([
      ['esteh', 5, 28_000],
      ['bakso', 1, 15_000],
    ]);
    expect(report.bySalesMode.map((m) => m.label)).toEqual(['Dine In', 'Takeaway']);
    expect(report.byCashier[0]).toMatchObject({ label: 'Pemilik', transactions: 2 });
  });

  it('attributes a refund whose order is unknown to "Tidak diketahui"', () => {
    const report = reportToday([refund('MISSING', '2026-11-18', 3_000)]);
    expect(report.byPaymentMethod.find((r) => r.key === 'unknown')).toMatchObject({ refunds: 3_000, net: -3_000 });
  });
});

describe('summarize', () => {
  it('handles an empty period', () => {
    expect(summarize([], [])).toMatchObject({ grossSales: 0, netSales: 0, transactions: 0, averageTicket: 0 });
  });
});
