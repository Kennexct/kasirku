import { useLiveQuery } from 'dexie-react-hooks';
import { localDb } from '../db/localDb';
import type { Id, StoreMember } from '../types';

/** Active members, owner first then cashiers by name. */
export function useStaff(storeId: Id | null): StoreMember[] | undefined {
  return useLiveQuery(async () => {
    if (!storeId) return [];
    const members = await localDb.storeMembers.where('storeId').equals(storeId).filter((m) => !m.deletedAt).toArray();
    return members.sort((a, b) => (a.role === b.role ? a.displayName.localeCompare(b.displayName) : a.role === 'owner' ? -1 : 1));
  }, [storeId]);
}
