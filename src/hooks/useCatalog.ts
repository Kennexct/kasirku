import { useLiveQuery } from 'dexie-react-hooks';
import { localDb } from '../db/localDb';
import type {
  Category,
  Discount,
  Id,
  PaymentMethod,
  Product,
  SalesMode,
  Store,
  SyncMeta,
  VariantGroup,
} from '../types';

export interface Catalog {
  products: Product[];
  categories: Category[];
  variantGroups: VariantGroup[];
  salesModes: SalesMode[];
  paymentMethods: PaymentMethod[];
  discounts: Discount[];
}

const notDeleted = <T extends SyncMeta>(rows: T[]): T[] => rows.filter((row) => !row.deletedAt);
const bySortOrder = <T extends { sortOrder: number }>(rows: T[]): T[] =>
  [...rows].sort((a, b) => a.sortOrder - b.sortOrder);

/** Live view of the store's catalog from IndexedDB; re-renders on any local change. */
export function useCatalog(storeId: Id | null): Catalog | undefined {
  return useLiveQuery(async () => {
    if (!storeId) return undefined;
    const [products, categories, variantGroups, salesModes, paymentMethods, discounts] = await Promise.all([
      localDb.products.where('storeId').equals(storeId).toArray(),
      localDb.categories.where('storeId').equals(storeId).toArray(),
      localDb.variantGroups.where('storeId').equals(storeId).toArray(),
      localDb.salesModes.where('storeId').equals(storeId).toArray(),
      localDb.paymentMethods.where('storeId').equals(storeId).toArray(),
      localDb.discounts.where('storeId').equals(storeId).toArray(),
    ]);

    const catalog: Catalog = {
      products: bySortOrder(notDeleted(products)),
      categories: bySortOrder(notDeleted(categories)),
      variantGroups: notDeleted(variantGroups),
      salesModes: bySortOrder(notDeleted(salesModes)),
      paymentMethods: bySortOrder(notDeleted(paymentMethods)),
      discounts: notDeleted(discounts),
    };
    return catalog;
  }, [storeId]);
}

export function useStore(storeId: Id | null): Store | undefined {
  return useLiveQuery(async () => (storeId ? localDb.stores.get(storeId) : undefined), [storeId]);
}
