import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { localDb } from '../db/localDb';
import type { Order, OrderItem, Store } from '../types';
import { ensureLocalStore } from './bootstrap';
import { completeOrder } from './orders';
import { canRefund, canVoid, refundOrder, voidOrder, type RefundContext } from './refunds';

const items: OrderItem[] = [
  { id: 'bakso', productId: 'p1', nameSnapshot: 'Bakso', unitPrice: 15_000, qty: 2, options: [], discount: null, note: '' },
  { id: 'esteh', productId: 'p2', nameSnapshot: 'Es Teh', unitPrice: 5_000, qty: 1, options: [], discount: null, note: '' },
];
const reason = { code: 'customer_cancel' as const, note: '' };

async function sell(): Promise<{ order: Order; ctx: RefundContext; store: Store }> {
  const { store, owner } = await ensureLocalStore();
  const salesMode = (await localDb.salesModes.where('storeId').equals(store.id).toArray()).find((m) => m.isDefault);
  const cash = (await localDb.paymentMethods.where('storeId').equals(store.id).toArray()).find((m) => m.type === 'cash');
  if (!salesMode || !cash) throw new Error('seed missing');
  const order = await completeOrder(
    { openOrderId: null, items, orderDiscount: null, customerId: null, label: '' },
    { store, salesMode, cashierId: owner.id },
    { method: cash, amount: 35_000, cashReceived: 50_000 },
  );
  return { order, store, ctx: { store, actorId: owner.id, access: { kind: 'open' } } };
}

const nextDay = (order: Order) => new Date(new Date(order.paidAt ?? '').getTime() + 86_400_000);

beforeEach(async () => {
  await localDb.delete();
  await localDb.open();
});

describe('voidOrder', () => {
  it('voids a same-day sale, records items + audit, and sets status', async () => {
    const { order, ctx } = await sell();
    const refund = await voidOrder(order.id, reason, ctx);

    expect(refund.kind).toBe('void');
    expect(refund.amount).toBe(35_000);
    expect((await localDb.orders.get(order.id))?.status).toBe('void');
    expect(await localDb.auditEvents.where('entityId').equals(order.id).count()).toBe(1);
    expect(await localDb.outbox.where('recordId').equals(refund.id).count()).toBe(1);
    await expect(voidOrder(order.id, reason, ctx)).rejects.toThrow(/lunas/);
  });

  it('blocks void on a later business day before asking for any PIN', async () => {
    const { order, ctx } = await sell();
    const result = canVoid(order, [], { ...ctx, access: { kind: 'locked' }, now: nextDay(order) });
    expect(result).toEqual({ ok: false, reason: expect.stringMatching(/hari ini/) });
  });

  it('needs the owner PIN when locked, records the approver, and rejects an expired approval (ADR-004)', async () => {
    const { order, ctx } = await sell();
    expect(canVoid(order, [], { ...ctx, access: { kind: 'locked' } })).toMatchObject({ ok: false, needsOwnerPin: true });
    await expect(voidOrder(order.id, reason, { ...ctx, actorId: 'cashier-1', access: { kind: 'locked' } })).rejects.toThrow(/PIN pemilik/);

    const expired = { kind: 'approved' as const, ownerId: ctx.actorId, grantedAt: Date.now() - 6 * 60_000 };
    await expect(voidOrder(order.id, reason, { ...ctx, actorId: 'cashier-1', access: expired })).rejects.toThrow(/kedaluwarsa/);

    const approved = { kind: 'approved' as const, ownerId: ctx.actorId, grantedAt: Date.now() };
    const refund = await voidOrder(order.id, reason, { ...ctx, actorId: 'cashier-1', access: approved });
    expect(refund).toMatchObject({ actorId: 'cashier-1', approvedById: ctx.actorId });
  });

  it('lets a cashier act freely when the rule says so', async () => {
    const { order, ctx, store } = await sell();
    const relaxed = { ...store, settings: { ...store.settings, voidPermission: 'cashier' as const } };
    expect(canVoid(order, [], { ...ctx, store: relaxed, access: { kind: 'locked' } })).toEqual({ ok: true });
  });
});

describe('refundOrder', () => {
  it('moves partial_refund -> refunded and nets exactly to the grand total', async () => {
    const { order, ctx } = await sell();
    const first = await refundOrder(order.id, [{ orderItemId: 'esteh', qty: 1 }], reason, ctx);
    expect(first.amount).toBe(5_000);
    expect((await localDb.orders.get(order.id))?.status).toBe('partial_refund');

    const second = await refundOrder(order.id, [{ orderItemId: 'bakso', qty: 2 }], reason, ctx);
    expect(first.amount + second.amount).toBe(35_000);
    expect((await localDb.orders.get(order.id))?.status).toBe('refunded');
    await expect(refundOrder(order.id, [{ orderItemId: 'bakso', qty: 1 }], reason, ctx)).rejects.toThrow(/tidak bisa direfund/);
  });

  it('dates a refund on the day it happens, not the sale day (ADR-002)', async () => {
    const { order, ctx } = await sell();
    const refund = await refundOrder(order.id, [{ orderItemId: 'esteh', qty: 1 }], reason, { ...ctx, now: nextDay(order) });
    expect(refund.businessDate).not.toBe(order.businessDate);
    expect(await localDb.refunds.where('[storeId+businessDate]').equals([order.storeId, refund.businessDate]).count()).toBe(1);
  });

  it('enforces refund window and reason note for "Lainnya"', async () => {
    const { order, ctx, store } = await sell();
    const late = new Date(new Date(order.paidAt ?? '').getTime() + 9 * 86_400_000);
    expect(canRefund(order, { ...ctx, now: late })).toEqual({ ok: false, reason: expect.stringMatching(/7 hari/) });
    expect(canRefund(order, { ...ctx, now: nextDay(order) }).ok).toBe(true);
    await expect(refundOrder(order.id, [{ orderItemId: 'esteh', qty: 1 }], { code: 'other', note: ' ' }, { ...ctx, store })).rejects.toThrow(/alasan/);
  });
});
