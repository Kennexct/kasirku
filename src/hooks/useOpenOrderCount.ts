import { useLiveQuery } from 'dexie-react-hooks';
import { localDb } from '../db/localDb';
import { useSessionStore } from '../store/useSessionStore';

/** Live count of unpaid orders for the nav badge (PRD M8). */
export function useOpenOrderCount(): number {
  const storeId = useSessionStore((s) => s.storeId);
  return (
    useLiveQuery(
      async () => (storeId ? localDb.orders.where('[storeId+status]').equals([storeId, 'open']).count() : 0),
      [storeId],
    ) ?? 0
  );
}
