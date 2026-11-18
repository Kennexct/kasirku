import { localDb } from '../db/localDb';
import type { Store, StoreMember, SyncTable } from '../types';
import { buildSeedBundle } from './seedTemplate';
import { saveAndQueue } from './sync';

export interface BootstrapResult {
  store: Store;
  owner: StoreMember;
}

let inFlight: Promise<BootstrapResult> | null = null;

/**
 * Loads the store on this device, or creates one from the starter template on first run.
 * De-duplicated so concurrent callers (React StrictMode double effects) never seed twice.
 * TODO(M15): replace with sign-up + pull from server once auth lands.
 */
export function ensureLocalStore(): Promise<BootstrapResult> {
  inFlight ??= loadOrSeed().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function loadOrSeed(): Promise<BootstrapResult> {
  const existing = await localDb.stores.toCollection().first();
  if (existing) {
    const owner = await localDb.storeMembers
      .where('storeId')
      .equals(existing.id)
      .filter((m) => m.role === 'owner' && !m.deletedAt)
      .first();
    if (!owner) throw new Error('Data pemilik toko tidak ditemukan di perangkat ini.');
    return { store: existing, owner };
  }

  const seed = buildSeedBundle();
  await localDb.stores.put(seed.store);

  const queued: Array<[SyncTable, Array<{ id: string }>]> = [
    ['storeMembers', [seed.owner]],
    ['categories', seed.categories],
    ['variantGroups', seed.variantGroups],
    ['salesModes', seed.salesModes],
    ['paymentMethods', seed.paymentMethods],
    ['products', seed.products],
    ['discounts', seed.discounts],
  ];
  for (const [table, records] of queued) {
    for (const record of records) {
      await saveAndQueue(table, record);
    }
  }
  return { store: seed.store, owner: seed.owner };
}

export async function updateStore(store: Store): Promise<void> {
  await localDb.stores.put(store);
}
