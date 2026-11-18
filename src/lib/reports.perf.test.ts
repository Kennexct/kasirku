import { describe, expect, it } from 'vitest';
import type { Order } from '../types';
import { datasetCsv } from './export/csv';
import { buildReport, type ReportInput } from './reports';

/** Guard: a busy month (≈ 650 orders/day × 31) must stay interactive on-device (ADR-001 risk). */
const ORDERS = 20_000;
/** 207 ms locally; shared CI runners are ~2–3× slower, so they get headroom instead of flaking. */
const BUDGET_MS = process.env.CI ? 1_500 : 500;

function makeOrders(): Order[] {
  return Array.from({ length: ORDERS }, (_, i) => {
    const day = String((i % 28) + 1).padStart(2, '0');
    const total = 5_000 + (i % 7) * 3_000;
    return {
      id: `o${i}`, storeId: 's', createdAt: '', updatedAt: '', receiptNo: `INV-202611${day}-A1${i}`, status: 'paid',
      salesModeId: i % 3 ? 'dine' : 'take', salesModeNameSnapshot: i % 3 ? 'Dine In' : 'Takeaway', customerId: null, label: '',
      items: [{ id: `l${i}`, productId: `p${i % 40}`, nameSnapshot: `Produk ${i % 40}`, unitPrice: total, qty: 1, options: [], discount: null, note: '' }],
      orderDiscount: null,
      payments: [{ id: 'p', paymentMethodId: i % 2 ? 'cash' : 'qris', methodNameSnapshot: i % 2 ? 'Tunai' : 'QRIS', methodType: i % 2 ? 'cash' : 'qris', amount: total }],
      totals: { subtotal: total, itemDiscountTotal: 0, orderDiscountTotal: 0, serviceTotal: 0, taxTotal: 0, grandTotal: total },
      cashierId: 'owner', businessDate: `2026-11-${day}`, openedAt: `2026-11-${day}T0${i % 10}:00:00Z`, paidAt: `2026-11-${day}T0${i % 10}:00:00Z`,
    } satisfies Order;
  });
}

describe('report performance', () => {
  it(`builds report + transactions CSV for ${ORDERS} orders within ${BUDGET_MS} ms`, () => {
    const sales = makeOrders();
    const input: ReportInput = {
      store: { timezone: 'Asia/Jakarta' },
      range: { from: '2026-11-01', to: '2026-11-30' },
      sales,
      refunds: [],
      ordersById: new Map(sales.map((o) => [o.id, o])),
      memberName: new Map([['owner', 'Pemilik']]),
    };
    const start = performance.now();
    const report = buildReport(input);
    const csv = datasetCsv('transactions', { input, timeZone: 'Asia/Jakarta' });
    const elapsed = performance.now() - start;

    expect(report.summary.transactions).toBe(ORDERS);
    expect(csv.split('\r\n').length).toBe(ORDERS + 2);
    expect(elapsed).toBeLessThan(BUDGET_MS);
  });
});
