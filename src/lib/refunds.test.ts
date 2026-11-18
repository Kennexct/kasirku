import { describe, expect, it } from 'vitest';
import type { Order, OrderItem, Refund } from '../types';
import { calculateTotals } from './pricing';
import { buildRefundItems, isFullyRefunded, remainingQtyByItem, totalRefunded } from './refunds';

const line = (id: string, unitPrice: number, qty: number): OrderItem => ({
  id, productId: id, nameSnapshot: id, unitPrice, qty, options: [], discount: null, note: '',
});

function makeOrder(items: OrderItem[], discountPct = 0, servicePct = 0): Order {
  const orderDiscount = discountPct ? { discountId: null, name: 'Promo', type: 'percent' as const, value: discountPct } : null;
  return {
    id: 'o1', storeId: 's', createdAt: '', updatedAt: '', receiptNo: 'INV', status: 'paid',
    salesModeId: 'm', salesModeNameSnapshot: 'Dine In', customerId: null, label: '', items, orderDiscount,
    payments: [], totals: calculateTotals(items, orderDiscount, { taxPct: 0, servicePct, isTaxInclusive: false }),
    cashierId: 'c', businessDate: '2026-11-18', openedAt: '', paidAt: '',
  };
}

const asRefund = (order: Order, built: ReturnType<typeof buildRefundItems>): Refund => ({
  id: 'r', storeId: 's', createdAt: '', updatedAt: '', orderId: order.id, businessDate: '2026-11-18', kind: 'refund', amount: built.amount,
  items: built.items, reasonCode: 'other', reasonNote: '', actorId: 'c', approvedById: null,
});

describe('buildRefundItems', () => {
  it('refunds a full line at its price when there are no order-level adjustments', () => {
    const order = makeOrder([line('bakso', 15_000, 2), line('esteh', 5_000, 1)]);
    expect(buildRefundItems(order, [{ orderItemId: 'esteh', qty: 1 }], []).amount).toBe(5_000);
  });

  it('spreads an order discount proportionally', () => {
    const order = makeOrder([line('bakso', 15_000, 2), line('esteh', 5_000, 1)], 10); // total 31.500
    expect(order.totals.grandTotal).toBe(31_500);
    expect(buildRefundItems(order, [{ orderItemId: 'bakso', qty: 1 }], []).amount).toBe(13_500);
  });

  it('absorbs rounding on the final refund so the order nets to zero', () => {
    const order = makeOrder([line('a', 10_000, 3)], 0, 5); // service 5% => 31.500, 10.500 per unit
    const first = buildRefundItems(order, [{ orderItemId: 'a', qty: 1 }], []);
    const r1 = asRefund(order, first);
    const second = buildRefundItems(order, [{ orderItemId: 'a', qty: 2 }], [r1]);
    expect(first.amount + second.amount).toBe(order.totals.grandTotal);
    expect(isFullyRefunded(order, [r1, asRefund(order, second)])).toBe(true);
  });

  it('rejects more than the remaining qty and empty selections', () => {
    const order = makeOrder([line('bakso', 15_000, 2)]);
    const r1 = asRefund(order, buildRefundItems(order, [{ orderItemId: 'bakso', qty: 1 }], []));
    expect(remainingQtyByItem(order, [r1]).get('bakso')).toBe(1);
    expect(() => buildRefundItems(order, [{ orderItemId: 'bakso', qty: 2 }], [r1])).toThrow(/maksimal 1/);
    expect(() => buildRefundItems(order, [{ orderItemId: 'bakso', qty: 0 }], [])).toThrow(/minimal satu/);
    expect(totalRefunded([r1])).toBe(15_000);
  });
});
