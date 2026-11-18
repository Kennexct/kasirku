import { CONFIG_NAME_MAX, MAX_PAYMENT_METHODS, MAX_SALES_MODES } from '../constants';
import { localDb } from '../db/localDb';
import { nowIso } from '../lib/id';
import type { Id, PaymentMethod, PaymentType, PriceRule, SalesMode } from '../types';
import { newMeta } from './catalog';
import { saveAndQueue } from './sync';

/**
 * User-managed payment methods and sales modes (ADR-006): create, rename, move, soft-delete.
 * Past sales keep the names they were made with (order snapshots), so deleting never rewrites history.
 */
type ConfigTable = 'paymentMethods' | 'salesModes';
type ConfigRow = PaymentMethod | SalesMode;

async function activeRows(table: ConfigTable, storeId: Id): Promise<ConfigRow[]> {
  const rows: ConfigRow[] =
    table === 'paymentMethods'
      ? await localDb.paymentMethods.where('storeId').equals(storeId).toArray()
      : await localDb.salesModes.where('storeId').equals(storeId).toArray();
  return rows.filter((row) => !row.deletedAt).sort((a, b) => a.sortOrder - b.sortOrder);
}

function cleanName(name: string, rows: readonly ConfigRow[], selfId: Id | null): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) throw new Error('Nama wajib diisi.');
  if (trimmed.length > CONFIG_NAME_MAX) throw new Error(`Nama maksimal ${CONFIG_NAME_MAX} karakter.`);
  const isTaken = rows.some((row) => row.id !== selfId && row.name.toLowerCase() === trimmed.toLowerCase());
  if (isTaken) throw new Error(`"${trimmed}" sudah ada.`);
  return trimmed;
}

const nextSortOrder = (rows: readonly ConfigRow[]): number => rows.reduce((max, row) => Math.max(max, row.sortOrder), -1) + 1;

async function requireRow(table: ConfigTable, id: Id): Promise<ConfigRow> {
  const row = table === 'paymentMethods' ? await localDb.paymentMethods.get(id) : await localDb.salesModes.get(id);
  if (!row || row.deletedAt) throw new Error('Data tidak ditemukan.');
  return row;
}

export async function createPaymentMethod(storeId: Id, input: { name: string; type: PaymentType }): Promise<PaymentMethod> {
  const rows = await activeRows('paymentMethods', storeId);
  if (rows.length >= MAX_PAYMENT_METHODS) throw new Error(`Maksimal ${MAX_PAYMENT_METHODS} metode pembayaran.`);
  const isCash = input.type === 'cash';
  const method: PaymentMethod = {
    ...newMeta(storeId),
    name: cleanName(input.name, rows, null),
    type: input.type,
    referenceMode: isCash ? 'off' : 'optional',
    referenceLabel: isCash ? '' : 'No. Ref',
    isActive: true,
    sortOrder: nextSortOrder(rows),
  };
  await saveAndQueue('paymentMethods', method);
  return method;
}

export async function createSalesMode(storeId: Id, input: { name: string; priceRule: PriceRule; markupPct: number }): Promise<SalesMode> {
  const rows = await activeRows('salesModes', storeId);
  if (rows.length >= MAX_SALES_MODES) throw new Error(`Maksimal ${MAX_SALES_MODES} mode penjualan.`);
  if (input.markupPct < 0 || input.markupPct > 100) throw new Error('Markup harus 0–100%.');
  const mode: SalesMode = {
    ...newMeta(storeId),
    name: cleanName(input.name, rows, null),
    isDefault: false,
    isActive: true,
    priceRule: input.priceRule,
    markupPct: input.priceRule === 'markup' ? input.markupPct : 0,
    sortOrder: nextSortOrder(rows),
  };
  await saveAndQueue('salesModes', mode);
  return mode;
}

export async function renameConfig(table: ConfigTable, id: Id, name: string): Promise<void> {
  const row = await requireRow(table, id);
  const rows = await activeRows(table, row.storeId);
  await saveAndQueue(table, { ...row, name: cleanName(name, rows, id), updatedAt: nowIso() });
}

/**
 * Soft delete. Guards: the default sales mode and the last active payment method must stay, and a mode that
 * unpaid saved orders were priced with cannot go (resuming them would silently change what the customer owes).
 */
export async function deleteConfig(table: ConfigTable, id: Id): Promise<void> {
  const row = await requireRow(table, id);
  if (table === 'salesModes' && (row as SalesMode).isDefault) {
    throw new Error('Mode default tidak bisa dihapus. Jadikan mode lain sebagai default dulu.');
  }
  if (table === 'salesModes') {
    const unpaid = await localDb.orders.where('[storeId+status]').equals([row.storeId, 'open']).filter((o) => o.salesModeId === id && !o.deletedAt).count();
    if (unpaid > 0) throw new Error(`Masih ada ${unpaid} pesanan tersimpan dengan mode ini. Selesaikan atau batalkan dulu.`);
  }
  if (table === 'paymentMethods') {
    const others = (await activeRows(table, row.storeId)).filter((r) => r.id !== id && r.isActive);
    if (others.length === 0) throw new Error('Harus ada minimal satu metode pembayaran aktif.');
  }
  const now = nowIso();
  await saveAndQueue(table, { ...row, isActive: false, deletedAt: now, updatedAt: now });
}

/** Moves a row one place up (-1) or down (+1) and renumbers `sortOrder` 0..n. This order is the order at the cashier. */
export async function moveConfig(table: ConfigTable, id: Id, direction: -1 | 1): Promise<void> {
  const row = await requireRow(table, id);
  const rows = await activeRows(table, row.storeId);
  const from = rows.findIndex((r) => r.id === id);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= rows.length) return;

  const reordered = [...rows];
  const [moved] = reordered.splice(from, 1);
  if (!moved) return;
  reordered.splice(to, 0, moved);

  const now = nowIso();
  for (const [index, current] of reordered.entries()) {
    if (current.sortOrder !== index) await saveAndQueue(table, { ...current, sortOrder: index, updatedAt: now });
  }
}
