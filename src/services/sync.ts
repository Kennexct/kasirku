import { SYNC_BATCH_SIZE, SYNC_MAX_ATTEMPTS } from '../constants';
import { localDb } from '../db/localDb';
import { nowIso } from '../lib/id';
import type { Id, OutboxEntry, Result, SyncTable } from '../types';
import { supabase } from './supabase';
import { t } from '../i18n';

/** Local Dexie table name -> Postgres table name. */
const REMOTE_TABLE: Record<SyncTable, string> = {
  categories: 'categories',
  products: 'products',
  variantGroups: 'variant_groups',
  salesModes: 'sales_modes',
  paymentMethods: 'payment_methods',
  discounts: 'discounts',
  customers: 'customers',
  orders: 'orders',
  refunds: 'refunds',
  auditEvents: 'audit_events',
  storeMembers: 'store_members',
  expenses: 'expenses',
  dayClosings: 'day_closings',
};

/**
 * Write a record locally AND queue it for sync in one transaction,
 * so a crash can never leave a sale saved but unsynced-forever.
 */
export async function saveAndQueue<T extends { id: Id }>(table: SyncTable, record: T): Promise<void> {
  const localTable = localDb.table(table);
  await localDb.transaction('rw', localTable, localDb.outbox, async () => {
    await localTable.put(record);
    await localDb.outbox.add({ table, recordId: record.id, op: 'upsert', queuedAt: nowIso(), attempts: 0 });
  });
}

/**
 * Push queued records. Idempotent: server upserts by client UUID,
 * so retries after a timeout never create duplicates.
 */
export async function pushOutbox(): Promise<Result<{ pushed: number }>> {
  if (!supabase) return { ok: false, error: t('Backend not configured') };
  if (!navigator.onLine) return { ok: false, error: t('Offline') };

  const entries = await localDb.outbox.orderBy('seq').limit(SYNC_BATCH_SIZE).toArray();
  let pushed = 0;

  for (const entry of entries) {
    const result = await pushEntry(entry);
    if (!result.ok) return { ok: false, error: result.error };
    pushed += 1;
  }
  return { ok: true, value: { pushed } };
}

async function pushEntry(entry: OutboxEntry): Promise<Result<true>> {
  if (!supabase || entry.seq === undefined) return { ok: false, error: t('Invalid sync state') };

  const record = await localDb.table(entry.table).get(entry.recordId);
  if (!record) {
    await localDb.outbox.delete(entry.seq);
    return { ok: true, value: true };
  }

  const { error } = await supabase.from(REMOTE_TABLE[entry.table]).upsert(toRemote(record));
  if (error) {
    const attempts = entry.attempts + 1;
    await localDb.outbox.update(entry.seq, { attempts, lastError: error.message });
    const message = attempts >= SYNC_MAX_ATTEMPTS ? t('Sync stuck for {0}: {1}', entry.table, error.message) : error.message;
    return { ok: false, error: message };
  }

  await localDb.outbox.delete(entry.seq);
  return { ok: true, value: true };
}

/** camelCase -> snake_case keys (shallow; nested JSON columns stay as-is). */
function toRemote(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`), value]),
  );
}

export async function pendingCount(): Promise<number> {
  return localDb.outbox.count();
}
