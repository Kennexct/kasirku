import type { Id, Order, Refund } from '../types';

export interface SalesSummary {
  transactions: number;
  grossSales: number;
  refunds: number;
  netSales: number;
  voidCount: number;
  averageTicket: number;
}

const COUNTED: ReadonlySet<Order['status']> = new Set(['paid', 'partial_refund', 'refunded']);

/** Gross = completed sales (voids excluded); refunds subtracted to get net (PRD M12 definitions). */
export function summarizeSales(orders: readonly Order[], refundsByOrder: ReadonlyMap<Id, Refund[]>): SalesSummary {
  const counted = orders.filter((o) => COUNTED.has(o.status));
  const grossSales = counted.reduce((sum, o) => sum + o.totals.grandTotal, 0);
  const refunds = counted.reduce(
    (sum, o) => sum + (refundsByOrder.get(o.id) ?? []).filter((r) => r.kind === 'refund').reduce((s, r) => s + r.amount, 0),
    0,
  );
  return {
    transactions: counted.length,
    grossSales,
    refunds,
    netSales: grossSales - refunds,
    voidCount: orders.filter((o) => o.status === 'void').length,
    averageTicket: counted.length > 0 ? Math.round(grossSales / counted.length) : 0,
  };
}
