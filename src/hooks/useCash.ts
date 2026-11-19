import { useLiveQuery } from 'dexie-react-hooks';
import { CLOSING_HISTORY_LIMIT } from '../constants';
import { localDb } from '../db/localDb';
import type { DrawerInput } from '../lib/cashDrawer';
import type { DateRange } from '../lib/dateRange';
import { isCountedSale } from '../lib/reports';
import { getClosing, loadDrawerInput } from '../services/dayClosing';
import type { BusinessDate, DayClosing, Expense, Id } from '../types';

export interface DrawerDay {
  input: DrawerInput;
  /** The live closing of the day, if it has been closed. */
  closing: DayClosing | null;
}

/** Everything the Kas screen shows for one business day; re-runs when sales, refunds, expenses or the closing change. */
export function useDrawerDay(storeId: Id | null, date: BusinessDate): DrawerDay | undefined {
  return useLiveQuery(async () => {
    if (!storeId) return undefined;
    return { input: await loadDrawerInput(storeId, date), closing: (await getClosing(storeId, date)) ?? null };
  }, [storeId, date]);
}

/** True when that day has sales but nobody closed it. */
export function useIsUnclosed(storeId: Id | null, date: BusinessDate): boolean {
  return (
    useLiveQuery(async () => {
      if (!storeId || (await getClosing(storeId, date))) return false;
      const sale = await localDb.orders.where('[storeId+businessDate]').equals([storeId, date]).filter(isCountedSale).first();
      return sale !== undefined;
    }, [storeId, date]) ?? false
  );
}

/** Live expenses in the period, newest first. */
export function useExpenses(storeId: Id | null, range: DateRange): Expense[] | undefined {
  return useLiveQuery(async () => {
    if (!storeId) return [];
    const rows = await localDb.expenses
      .where('[storeId+businessDate]')
      .between([storeId, range.from], [storeId, range.to], true, true)
      .filter((e) => !e.deletedAt)
      .toArray();
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [storeId, range.from, range.to]);
}

/** Recent closings, newest day first. */
export function useClosings(storeId: Id | null): DayClosing[] | undefined {
  return useLiveQuery(async () => {
    if (!storeId) return [];
    const rows = await localDb.dayClosings.where('storeId').equals(storeId).filter((c) => !c.deletedAt).toArray();
    return rows.sort((a, b) => b.businessDate.localeCompare(a.businessDate)).slice(0, CLOSING_HISTORY_LIMIT);
  }, [storeId]);
}

/** Display names of every member, including removed ones (they still appear on old records). */
export function useMemberNames(storeId: Id | null): ReadonlyMap<Id, string> {
  return (
    useLiveQuery(async () => {
      if (!storeId) return new Map<Id, string>();
      const members = await localDb.storeMembers.where('storeId').equals(storeId).toArray();
      return new Map(members.map((m) => [m.id, m.displayName]));
    }, [storeId]) ?? new Map<Id, string>()
  );
}
