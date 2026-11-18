import type { Id, Order, Refund, RefundItem } from '../types';
import { lineTotal } from './pricing';

export interface RefundSelection {
  orderItemId: Id;
  qty: number;
}

/** Qty already returned per order line across all prior refunds/voids. */
type RefundLike = Pick<Refund, 'items' | 'amount'>;

export function refundedQtyByItem(refunds: readonly Pick<Refund, 'items'>[]): Map<Id, number> {
  const map = new Map<Id, number>();
  for (const refund of refunds) {
    for (const item of refund.items) {
      map.set(item.orderItemId, (map.get(item.orderItemId) ?? 0) + item.qty);
    }
  }
  return map;
}

export function remainingQtyByItem(order: Order, refunds: readonly Pick<Refund, 'items'>[]): Map<Id, number> {
  const refunded = refundedQtyByItem(refunds);
  return new Map(order.items.map((item) => [item.id, Math.max(0, item.qty - (refunded.get(item.id) ?? 0))]));
}

export function totalRefunded(refunds: readonly Pick<Refund, 'amount'>[]): number {
  return refunds.reduce((sum, refund) => sum + refund.amount, 0);
}

/**
 * Refund lines and amount for a selection.
 * Each unit is worth its share of the grand total (so order discounts, service and tax are returned
 * proportionally). When the selection empties the order, the last refund absorbs rounding so
 * total refunded == grand total exactly.
 */
export function buildRefundItems(
  order: Order,
  selections: readonly RefundSelection[],
  priorRefunds: readonly RefundLike[],
): { items: RefundItem[]; amount: number } {
  const remaining = remainingQtyByItem(order, priorRefunds);
  const netTotal = order.items.reduce((sum, item) => sum + lineTotal(item), 0);
  const items: RefundItem[] = [];

  for (const selection of selections) {
    if (selection.qty <= 0) continue;
    const line = order.items.find((item) => item.id === selection.orderItemId);
    if (!line) throw new Error('Item tidak ditemukan di pesanan ini.');
    const available = remaining.get(line.id) ?? 0;
    if (selection.qty > available) throw new Error(`${line.nameSnapshot}: maksimal ${available} yang bisa direfund.`);

    const share = netTotal === 0 ? 0 : (order.totals.grandTotal * lineTotal(line) * selection.qty) / (netTotal * line.qty);
    items.push({ orderItemId: line.id, qty: selection.qty, amount: Math.round(share) });
  }

  if (items.length === 0) throw new Error('Pilih minimal satu item untuk direfund.');

  const remainingAfter = order.items.reduce((sum, item) => {
    const selected = items.find((i) => i.orderItemId === item.id)?.qty ?? 0;
    return sum + (remaining.get(item.id) ?? 0) - selected;
  }, 0);

  let amount = items.reduce((sum, item) => sum + item.amount, 0);
  if (remainingAfter === 0) {
    const absorbed = order.totals.grandTotal - totalRefunded(priorRefunds);
    const delta = absorbed - amount;
    const last = items[items.length - 1];
    if (last) items[items.length - 1] = { ...last, amount: last.amount + delta };
    amount = absorbed;
  }
  return { items, amount };
}

/** True when every unit of every line has been returned. */
export function isFullyRefunded(order: Order, refunds: readonly Pick<Refund, 'items'>[]): boolean {
  return Array.from(remainingQtyByItem(order, refunds).values()).every((qty) => qty === 0);
}
