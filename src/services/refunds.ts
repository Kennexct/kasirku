import { REFUND_REASON_LABEL } from '../constants';
import { localDb } from '../db/localDb';
import { getBusinessDate } from '../lib/businessDate';
import { daysBetween } from '../lib/dateRange';
import { nowIso, uuidv7 } from '../lib/id';
import { checkPermission, PERMISSION_MESSAGE } from '../lib/permissions';
import { buildRefundItems, isFullyRefunded, type RefundSelection } from '../lib/refunds';
import type { Id, Order, Refund, RefundKind, RefundReason, Role, Store } from '../types';
import { saveAndQueue } from './sync';

export interface ReasonInput {
  code: RefundReason;
  note: string;
}

export interface RefundContext {
  store: Store;
  actorId: Id;
  actorRole: Role;
  now?: Date;
}

export type Eligibility = { ok: true } | { ok: false; reason: string };

const REFUNDABLE_STATUSES: ReadonlySet<Order['status']> = new Set(['paid', 'partial_refund']);

/** M11: void = cancel a whole paid sale on the same business day, before any refund. */
export function canVoid(order: Order, refunds: readonly Refund[], ctx: RefundContext): Eligibility {
  const permission = checkPermission(ctx.store.settings.voidPermission, ctx.actorRole);
  if (permission !== 'allowed') return { ok: false, reason: PERMISSION_MESSAGE[permission] };
  if (order.status !== 'paid') return { ok: false, reason: 'Hanya transaksi lunas yang bisa di-void.' };
  if (refunds.length > 0) return { ok: false, reason: 'Transaksi sudah direfund sebagian. Gunakan refund.' };
  const today = getBusinessDate(ctx.now ?? new Date(), ctx.store);
  if (order.businessDate !== today) return { ok: false, reason: 'Void hanya untuk transaksi hari ini. Gunakan refund.' };
  return { ok: true };
}

/** M11: refund = return some or all items within the store's refund window. */
export function canRefund(order: Order, ctx: RefundContext): Eligibility {
  const permission = checkPermission(ctx.store.settings.refundPermission, ctx.actorRole);
  if (permission !== 'allowed') return { ok: false, reason: PERMISSION_MESSAGE[permission] };
  if (!REFUNDABLE_STATUSES.has(order.status)) return { ok: false, reason: 'Transaksi ini tidak bisa direfund.' };
  const today = getBusinessDate(ctx.now ?? new Date(), ctx.store);
  const age = daysBetween(order.businessDate, today);
  if (age > ctx.store.settings.refundWindowDays) {
    return { ok: false, reason: `Batas refund ${ctx.store.settings.refundWindowDays} hari sudah lewat.` };
  }
  return { ok: true };
}

function validateReason(reason: ReasonInput, store: Store): void {
  if (store.settings.isReasonRequired && reason.code === 'other' && reason.note.trim().length === 0) {
    throw new Error('Tuliskan alasannya.');
  }
}

async function loadOrder(orderId: Id): Promise<{ order: Order; refunds: Refund[] }> {
  const order = await localDb.orders.get(orderId);
  if (!order) throw new Error('Transaksi tidak ditemukan.');
  const refunds = await localDb.refunds.where('orderId').equals(orderId).toArray();
  return { order, refunds };
}

/**
 * Writes the refund record, the new order status and an audit event in ONE IndexedDB
 * transaction, so a crash can never leave money returned without a matching status.
 */
async function commit(order: Order, kind: RefundKind, built: ReturnType<typeof buildRefundItems>, reason: ReasonInput, ctx: RefundContext, nextStatus: Order['status']): Promise<Refund> {
  const now = nowIso();
  const refund: Refund = {
    id: uuidv7(),
    storeId: order.storeId,
    createdAt: now,
    updatedAt: now,
    orderId: order.id,
    businessDate: getBusinessDate(ctx.now ?? new Date(), ctx.store),
    kind,
    amount: built.amount,
    items: built.items,
    reasonCode: reason.code,
    reasonNote: reason.note.trim(),
    actorId: ctx.actorId,
    approvedById: null,
  };

  await localDb.transaction('rw', [localDb.orders, localDb.refunds, localDb.auditEvents, localDb.outbox], async () => {
    await saveAndQueue('refunds', refund);
    await saveAndQueue('orders', { ...order, status: nextStatus, updatedAt: now });
    await saveAndQueue('auditEvents', {
      id: uuidv7(),
      storeId: order.storeId,
      createdAt: now,
      updatedAt: now,
      entity: 'order',
      entityId: order.id,
      action: kind,
      actorId: ctx.actorId,
      payload: {
        receiptNo: order.receiptNo,
        amount: refund.amount,
        reason: REFUND_REASON_LABEL[reason.code],
        note: refund.reasonNote,
        items: refund.items,
      },
    });
  });
  return refund;
}

export async function voidOrder(orderId: Id, reason: ReasonInput, ctx: RefundContext): Promise<Refund> {
  validateReason(reason, ctx.store);
  const { order, refunds } = await loadOrder(orderId);
  const eligibility = canVoid(order, refunds, ctx);
  if (!eligibility.ok) throw new Error(eligibility.reason);

  const all = order.items.map((item) => ({ orderItemId: item.id, qty: item.qty }));
  return commit(order, 'void', buildRefundItems(order, all, []), reason, ctx, 'void');
}

export async function refundOrder(orderId: Id, selections: readonly RefundSelection[], reason: ReasonInput, ctx: RefundContext): Promise<Refund> {
  validateReason(reason, ctx.store);
  const { order, refunds } = await loadOrder(orderId);
  const eligibility = canRefund(order, ctx);
  if (!eligibility.ok) throw new Error(eligibility.reason);

  const built = buildRefundItems(order, selections, refunds);
  if (built.amount <= 0) throw new Error('Tidak ada nominal yang bisa direfund.');
  const nextStatus = isFullyRefunded(order, [...refunds, { items: built.items }]) ? 'refunded' : 'partial_refund';
  return commit(order, 'refund', built, reason, ctx, nextStatus);
}
