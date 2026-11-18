import { useLiveQuery } from 'dexie-react-hooks';
import { localDb } from '../db/localDb';
import { customerStats, type CustomerStats } from '../lib/customers';
import type { Customer, Id, Order } from '../types';

/** Active customers of the store, A–Z. */
export function useCustomers(storeId: Id | null): Customer[] | undefined {
  return useLiveQuery(async () => {
    if (!storeId) return [];
    const rows = await localDb.customers.where('storeId').equals(storeId).filter((c) => !c.deletedAt).toArray();
    return rows.sort((a, b) => a.name.localeCompare(b.name, 'id'));
  }, [storeId]);
}

export function useCustomer(customerId: Id | null | undefined): Customer | undefined {
  return useLiveQuery(async () => (customerId ? localDb.customers.get(customerId) : undefined), [customerId]);
}

/** Visits / spend / last visit per customer. Uses the `customerId` index, so orders without a customer are never read. */
export function useCustomerStats(storeId: Id | null): ReadonlyMap<Id, CustomerStats> | undefined {
  return useLiveQuery(async () => {
    if (!storeId) return new Map<Id, CustomerStats>();
    const orders = await localDb.orders.where('customerId').above('').filter((o) => o.storeId === storeId && !o.deletedAt).toArray();
    return customerStats(orders);
  }, [storeId]);
}

/** A customer's orders, newest first. */
export function useCustomerOrders(customerId: Id | null): Order[] | undefined {
  return useLiveQuery(async () => {
    if (!customerId) return [];
    const orders = await localDb.orders.where('customerId').equals(customerId).filter((o) => !o.deletedAt).toArray();
    return orders.sort((a, b) => (b.paidAt ?? b.updatedAt).localeCompare(a.paidAt ?? a.updatedAt));
  }, [customerId]);
}
