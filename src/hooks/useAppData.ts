import { useSessionStore } from '../store/useSessionStore';
import type { Store } from '../types';
import { useCatalog, useStore, type Catalog } from './useCatalog';

interface AppData {
  store: Store | undefined;
  catalog: Catalog | undefined;
  cashierId: string;
  cashierName: string;
  isOwner: boolean;
}

/** Everything a page needs about the current store, catalog and signed-in cashier. */
export function useAppData(): AppData {
  const storeId = useSessionStore((s) => s.storeId);
  const cashier = useSessionStore((s) => s.cashier);
  return {
    store: useStore(storeId),
    catalog: useCatalog(storeId),
    cashierId: cashier?.memberId ?? '',
    cashierName: cashier?.displayName ?? '',
    isOwner: cashier?.role === 'owner',
  };
}
