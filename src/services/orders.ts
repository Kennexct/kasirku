import { ORDER_STATUS_LABEL } from '../constants';
import { localDb } from '../db/localDb';
import { formatReceiptNo, getBusinessDate } from '../lib/businessDate';
import { nowIso, uuidv7 } from '../lib/id';
import { calculateTotals } from '../lib/pricing';
import type { AppliedDiscount, Id, Order, OrderItem, OrderPayment, PaymentMethod, SalesMode, Store } from '../types';
import { saveAndQueue } from './sync';

const DEVICE_CODE_KEY = 'deviceCode';
const DEVICE_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export interface CartSnapshot {
  openOrderId: Id | null;
  items: OrderItem[];
  orderDiscount: AppliedDiscount | null;
  customerId: Id | null;
  label: string;
}

interface OrderContext {
  store: Store;
  salesMode: SalesMode;
  cashierId: Id;
}

export interface PaymentInput {
  method: PaymentMethod;
  amount: number;
  reference?: string;
  cashReceived?: number;
}

/**
 * 2-char device code used in receipt numbers so offline devices never collide.
 * TODO(M15): have the server assign it at device registration to make collisions impossible.
 */
async function getDeviceCode(): Promise<string> {
  const existing = await localDb.meta.get(DEVICE_CODE_KEY);
  if (existing) return existing.value;
  const random = crypto.getRandomValues(new Uint8Array(2));
  const code = Array.from(random, (b) => DEVICE_CODE_CHARS[b % DEVICE_CODE_CHARS.length]).join('');
  await localDb.meta.put({ key: DEVICE_CODE_KEY, value: code });
  return code;
}

async function nextReceiptNo(businessDate: string): Promise<string> {
  const deviceCode = await getDeviceCode();
  const key = `seq:${businessDate}`;
  return localDb.transaction('rw', localDb.meta, async () => {
    const current = Number((await localDb.meta.get(key))?.value ?? '0');
    const next = current + 1;
    await localDb.meta.put({ key, value: String(next) });
    return formatReceiptNo(businessDate, deviceCode, next);
  });
}

async function buildOrder(cart: CartSnapshot, ctx: OrderContext): Promise<Order> {
  if (cart.items.length === 0) throw new Error('Keranjang masih kosong.');

  const now = nowIso();
  const existing = cart.openOrderId ? await localDb.orders.get(cart.openOrderId) : undefined;
  if (existing && existing.status !== 'open') {
    throw new Error(`Pesanan ${existing.receiptNo} berstatus ${ORDER_STATUS_LABEL[existing.status]}, tidak bisa diubah.`);
  }
  const businessDate = existing?.businessDate ?? getBusinessDate(new Date(), ctx.store);

  return {
    id: existing?.id ?? uuidv7(),
    storeId: ctx.store.id,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    receiptNo: existing?.receiptNo ?? (await nextReceiptNo(businessDate)),
    status: 'open',
    salesModeId: ctx.salesMode.id,
    salesModeNameSnapshot: ctx.salesMode.name,
    customerId: cart.customerId,
    label: cart.label,
    items: cart.items,
    orderDiscount: cart.orderDiscount,
    payments: [],
    totals: calculateTotals(cart.items, cart.orderDiscount, ctx.store),
    cashierId: ctx.cashierId,
    businessDate,
    openedAt: existing?.openedAt ?? now,
    paidAt: null,
  };
}

/** M8: save an unpaid order ("bayar nanti"). A label is required so it can be found later. */
export async function saveOpenOrder(cart: CartSnapshot, ctx: OrderContext): Promise<Order> {
  if (cart.label.trim().length === 0) throw new Error('Isi label pesanan (contoh: Meja 5).');
  const order = await buildOrder(cart, ctx);
  await saveAndQueue('orders', order);
  return order;
}

export function validatePayment(payment: PaymentInput, grandTotal: number): string | null {
  const { method, reference, cashReceived } = payment;
  if (method.referenceMode === 'required' && !reference?.trim()) {
    return `${method.referenceLabel || 'Referensi'} wajib diisi untuk ${method.name}.`;
  }
  if (method.type === 'cash' && (cashReceived ?? 0) < grandTotal) {
    return 'Uang diterima kurang dari total.';
  }
  return null;
}

/** M1/M5: complete a sale with a single payment method (split payment is planned for v1.1). */
export async function completeOrder(cart: CartSnapshot, ctx: OrderContext, payment: PaymentInput): Promise<Order> {
  const draft = await buildOrder(cart, ctx);
  const error = validatePayment(payment, draft.totals.grandTotal);
  if (error) throw new Error(error);

  const isCash = payment.method.type === 'cash';
  const orderPayment: OrderPayment = {
    id: uuidv7(),
    paymentMethodId: payment.method.id,
    methodNameSnapshot: payment.method.name,
    methodType: payment.method.type,
    amount: draft.totals.grandTotal,
    reference: payment.reference?.trim() || undefined,
    cashReceived: isCash ? payment.cashReceived : undefined,
    change: isCash ? (payment.cashReceived ?? 0) - draft.totals.grandTotal : undefined,
  };

  const order: Order = { ...draft, status: 'paid', payments: [orderPayment], paidAt: nowIso() };
  await saveAndQueue('orders', order);
  return order;
}

/** M8: cancel an unpaid order with a reason. Kept as a record (never deleted) and audited. */
export async function cancelOpenOrder(orderId: Id, reason: string, actorId: Id): Promise<void> {
  if (reason.trim().length === 0) throw new Error('Alasan pembatalan wajib diisi.');
  const order = await localDb.orders.get(orderId);
  if (!order) throw new Error('Pesanan tidak ditemukan.');
  if (order.status !== 'open') throw new Error('Hanya pesanan terbuka yang bisa dibatalkan.');

  const now = nowIso();
  await saveAndQueue('orders', { ...order, status: 'cancelled', updatedAt: now });
  await saveAndQueue('auditEvents', {
    id: uuidv7(),
    storeId: order.storeId,
    createdAt: now,
    updatedAt: now,
    entity: 'order',
    entityId: order.id,
    action: 'cancel_open_order',
    actorId,
    payload: { receiptNo: order.receiptNo, reason: reason.trim(), grandTotal: order.totals.grandTotal },
  });
}
