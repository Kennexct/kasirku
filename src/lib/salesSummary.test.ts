import { describe, expect, it } from 'vitest';
import type { Order, Refund } from '../types';
import { summarizeSales } from './salesSummary';

const order = (id: string, status: Order['status'], grandTotal: number): Order =>
  ({ id, status, totals: { grandTotal } } as unknown as Order);
const refund = (orderId: string, kind: Refund['kind'], amount: number): Refund =>
  ({ orderId, kind, amount } as unknown as Refund);

describe('summarizeSales', () => {
  it('excludes voids and cancelled orders, subtracts refunds', () => {
    const orders = [order('a', 'paid', 30_000), order('b', 'partial_refund', 20_000), order('c', 'void', 50_000), order('d', 'cancelled', 9_000)];
    const refunds = new Map([['b', [refund('b', 'refund', 5_000)]], ['c', [refund('c', 'void', 50_000)]]]);
    expect(summarizeSales(orders, refunds)).toEqual({
      transactions: 2,
      grossSales: 50_000,
      refunds: 5_000,
      netSales: 45_000,
      voidCount: 1,
      averageTicket: 25_000,
    });
  });
});
