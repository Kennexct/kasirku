import { useLiveQuery } from 'dexie-react-hooks';
import { localDb } from '../db/localDb';
import type { DateRange } from '../lib/dateRange';
import type { Id, Order, Refund, StoreMember } from '../types';

export interface OrderHistory {
  orders: Order[];
  refundsByOrder: ReadonlyMap<Id, Refund[]>;
  memberName: ReadonlyMap<Id, string>;
}

/** Live orders (excluding open ones) + their refunds for a business-date range, newest first. */
export function useOrderHistory(storeId: Id | null, range: DateRange): OrderHistory | undefined {
  return useLiveQuery(async () => {
    if (!storeId) return undefined;
    const orders = await localDb.orders
      .where('[storeId+businessDate]')
      .between([storeId, range.from], [storeId, range.to], true, true)
      .filter((order) => order.status !== 'open' && !order.deletedAt)
      .toArray();
    orders.sort((a, b) => (b.paidAt ?? b.updatedAt).localeCompare(a.paidAt ?? a.updatedAt));

    const ids = orders.map((o) => o.id);
    const refunds = ids.length > 0 ? await localDb.refunds.where('orderId').anyOf(ids).toArray() : [];
    const refundsByOrder = new Map<Id, Refund[]>();
    for (const refund of refunds) {
      refundsByOrder.set(refund.orderId, [...(refundsByOrder.get(refund.orderId) ?? []), refund]);
    }

    const members: StoreMember[] = await localDb.storeMembers.where('storeId').equals(storeId).toArray();
    const memberName = new Map(members.map((m) => [m.id, m.displayName]));
    return { orders, refundsByOrder, memberName };
  }, [storeId, range.from, range.to]);
}
