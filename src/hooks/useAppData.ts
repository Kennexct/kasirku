import { hasOwnerPowers, type OwnerAccess } from '../lib/permissions';
import { useSessionStore } from '../store/useSessionStore';
import type { Store } from '../types';
import { useCatalog, useStore, type Catalog } from './useCatalog';
import { useOwnerAccess } from './useOwnerAccess';

interface AppData {
  store: Store | undefined;
  catalog: Catalog | undefined;
  cashierId: string;
  cashierName: string;
  access: OwnerAccess;
  /** True when owner-only actions need no PIN right now (no PIN set, or owner mode unlocked). */
  hasOwnerPowers: boolean;
}

/** Everything a page needs about the current store, catalog, seller and owner access. */
export function useAppData(): AppData {
  const storeId = useSessionStore((s) => s.storeId);
  const cashier = useSessionStore((s) => s.cashier);
  const access = useOwnerAccess();
  return {
    store: useStore(storeId),
    catalog: useCatalog(storeId),
    cashierId: cashier?.memberId ?? '',
    cashierName: cashier?.displayName ?? '',
    access,
    hasOwnerPowers: hasOwnerPowers(access),
  };
}
