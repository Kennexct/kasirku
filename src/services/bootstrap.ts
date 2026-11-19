import { localDb } from '../db/localDb';
import type { Store, StoreMember, SyncTable } from '../types';
import { nowIso } from '../lib/id';
import { buildSeedBundle, DEFAULT_SETUP, type SeedSetup } from './seedTemplate';
import { saveAndQueue } from './sync';
import { t } from '../i18n';

export interface BootstrapResult {
  store: Store;
  owner: StoreMember;
}

export const ONBOARDED_AT_KEY = 'onboardedAt';
let inFlight: Promise<BootstrapResult> | null = null;

/** The store on this device, or null on a brand-new device (ADR-009: that is the cue for the first-time journey). */
export async function findLocalStore(): Promise<BootstrapResult | null> {
  const store = await localDb.stores.toCollection().first();
  if (!store) return null;
  const owner = await localDb.storeMembers
    .where('storeId')
    .equals(store.id)
    .filter((m) => m.role === 'owner' && !m.deletedAt)
    .first();
  if (!owner) throw new Error(t('Data pemilik toko tidak ditemukan di perangkat ini.'));
  return { store, owner };
}

/**
 * Creates the store from a starter template and the merchant's choices. Returns the existing store if there is one.
 * De-duplicated so a double tap or React StrictMode's double effect never seeds twice.
 */
export function createLocalStore(setup: SeedSetup = DEFAULT_SETUP): Promise<BootstrapResult> {
  inFlight ??= seedOnce(setup).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

/** Loads the store, or creates the default one. Used by tests and by "Lewati" in the first-time journey. */
export const ensureLocalStore = (): Promise<BootstrapResult> => createLocalStore();

async function seedOnce(setup: SeedSetup): Promise<BootstrapResult> {
  const existing = await findLocalStore();
  if (existing) return existing;

  const seed = buildSeedBundle(setup);
  const queued: Array<[SyncTable, Array<{ id: string }>]> = [
    ['storeMembers', [seed.owner]],
    ['categories', seed.categories],
    ['variantGroups', seed.variantGroups],
    ['salesModes', seed.salesModes],
    ['paymentMethods', seed.paymentMethods],
    ['products', seed.products],
    ['discounts', seed.discounts],
  ];
  // All or nothing: closing the app mid-setup must not leave half a menu behind. The store row goes last —
  // its presence means "this device is fully set up".
  await localDb.transaction('rw', localDb.tables, async () => {
    for (const [table, records] of queued) {
      for (const record of records) await saveAndQueue(table, record);
    }
    await localDb.meta.put({ key: ONBOARDED_AT_KEY, value: nowIso() });
    await localDb.stores.put(seed.store);
  });
  return { store: seed.store, owner: seed.owner };
}

export async function updateStore(store: Store): Promise<void> {
  await localDb.stores.put(store);
}
