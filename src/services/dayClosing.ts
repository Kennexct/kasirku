import { CLOSING_NOTE_MAX } from '../constants';
import { localDb } from '../db/localDb';
import { buildDrawer, type DrawerInput } from '../lib/cashDrawer';
import { nowIso } from '../lib/id';
import type { BusinessDate, DayClosing, Id } from '../types';
import { writeAudit } from './audit';
import { newMeta } from './catalog';
import { saveAndQueue } from './sync';

const openingKey = (storeId: Id, date: BusinessDate) => `openingCash:${storeId}:${date}`;

export async function getClosing(storeId: Id, date: BusinessDate): Promise<DayClosing | undefined> {
  return localDb.dayClosings
    .where('[storeId+businessDate]')
    .equals([storeId, date])
    .filter((c) => !c.deletedAt)
    .first();
}

/** What was typed for the day, else the previous closing's opening cash (sellers usually start with the same float). */
export async function getOpeningCash(storeId: Id, date: BusinessDate): Promise<number> {
  const typed = await localDb.meta.get(openingKey(storeId, date));
  if (typed) return Number(typed.value) || 0;
  const earlier = await localDb.dayClosings
    .where('[storeId+businessDate]')
    .between([storeId, ''], [storeId, date], true, false)
    .filter((c) => !c.deletedAt)
    .last();
  return earlier?.openingCash ?? 0;
}

export async function setOpeningCash(storeId: Id, date: BusinessDate, amount: number): Promise<void> {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new Error('Modal awal tidak valid.');
  if (await getClosing(storeId, date)) throw new Error('Hari ini sudah ditutup. Buka kembali untuk mengubah modal awal.');
  await localDb.meta.put({ key: openingKey(storeId, date), value: String(amount) });
}

/** Everything the drawer maths needs for one business day. Also used inside live queries. */
export async function loadDrawerInput(storeId: Id, date: BusinessDate): Promise<DrawerInput> {
  const key = [storeId, date];
  const sales = await localDb.orders
    .where('[storeId+businessDate]')
    .equals(key)
    .filter((o) => o.status !== 'open' && !o.deletedAt)
    .toArray();
  const refunds = await localDb.refunds.where('[storeId+businessDate]').equals(key).toArray();
  const ordersById = new Map(sales.map((o) => [o.id, o]));
  const missing = [...new Set(refunds.map((r) => r.orderId))].filter((id) => !ordersById.has(id));
  for (const order of missing.length > 0 ? await localDb.orders.bulkGet(missing) : []) if (order) ordersById.set(order.id, order);

  const expenses = await localDb.expenses.where('[storeId+businessDate]').equals(key).filter((e) => !e.deletedAt).toArray();
  const openOrders = await localDb.orders.where('[storeId+status]').equals([storeId, 'open']).filter((o) => !o.deletedAt).toArray();
  return { openingCash: await getOpeningCash(storeId, date), sales, refunds, ordersById, expenses, openOrders };
}

/** Switch every "Habis" item back to available (ADR-006). Returns how many were reset. */
export async function resetSoldOut(storeId: Id): Promise<number> {
  const soldOut = await localDb.products.where('storeId').equals(storeId).filter((p) => p.isSoldOut === true && !p.deletedAt).toArray();
  const now = nowIso();
  for (const product of soldOut) await saveAndQueue('products', { ...product, isSoldOut: false, updatedAt: now });
  return soldOut.length;
}

export interface CloseDayInput {
  storeId: Id;
  businessDate: BusinessDate;
  /** Null while the field is empty. */
  countedCash: number | null;
  note: string;
  actorId: Id;
  shouldResetSoldOut: boolean;
}

/** "Tutup kasir" (ADR-007): stores the drawer figures as they are now, plus the counted cash. One per day. */
export async function closeDay(input: CloseDayInput): Promise<DayClosing> {
  const { storeId, businessDate, countedCash } = input;
  if (countedCash === null || !Number.isSafeInteger(countedCash) || countedCash < 0) throw new Error('Isi jumlah uang yang dihitung di laci.');
  const note = input.note.trim();
  if (note.length > CLOSING_NOTE_MAX) throw new Error(`Catatan maksimal ${CLOSING_NOTE_MAX} karakter.`);

  const drawer = buildDrawer(await loadDrawerInput(storeId, businessDate));
  const now = nowIso();
  const closing: DayClosing = {
    ...newMeta(storeId),
    ...drawer,
    businessDate,
    countedCash,
    difference: countedCash - drawer.expectedCash,
    note,
    closedById: input.actorId,
    closedAt: now,
  };

  // Check + write in one transaction so a double tap or a second tab cannot close the day twice.
  await localDb.transaction('rw', localDb.dayClosings, localDb.outbox, async () => {
    if (await getClosing(storeId, businessDate)) throw new Error('Hari ini sudah ditutup.');
    await saveAndQueue('dayClosings', closing);
  });

  await writeAudit({
    storeId,
    actorId: input.actorId,
    entity: 'day_closing',
    entityId: closing.id,
    action: 'day_closed',
    payload: { businessDate, expectedCash: closing.expectedCash, countedCash, difference: closing.difference },
  });
  if (input.shouldResetSoldOut) await resetSoldOut(storeId);
  return closing;
}

/** Owner only (caller checks, ADR-004): removes the closing so the day can be closed again. Audited. */
export async function reopenDay(closingId: Id, actorId: Id, approvedById: Id | null): Promise<void> {
  const closing = await localDb.dayClosings.get(closingId);
  if (!closing || closing.deletedAt) throw new Error('Tutup kasir tidak ditemukan.');
  const now = nowIso();
  await saveAndQueue('dayClosings', { ...closing, deletedAt: now, updatedAt: now });
  await writeAudit({
    storeId: closing.storeId,
    actorId,
    entity: 'day_closing',
    entityId: closing.id,
    action: 'day_reopened',
    payload: { businessDate: closing.businessDate, difference: closing.difference, approvedById },
  });
}
