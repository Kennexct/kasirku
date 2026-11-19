import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { localDb } from '../db/localDb';
import { ITEM_COLUMNS, itemRows } from '../lib/export/columns';
import { buildProfit } from '../lib/profit';
import { quantityForAmount } from '../lib/quantity';
import { buildRefundItems, isFullyRefunded } from '../lib/refunds';
import { buildReport } from '../lib/reports';
import { useCartStore } from '../store/useCartStore';
import type { OrderItem } from '../types';
import { ensureLocalStore } from './bootstrap';
import { completeOrder } from './orders';

beforeEach(async () => {
  await localDb.delete();
  await localDb.open();
  useCartStore.getState().clear();
});

const item = (rest: Partial<OrderItem>): OrderItem =>
  ({ id: 'i1', productId: 'p-cabai', nameSnapshot: 'Cabai Merah', unitPrice: 40_000, qty: 1, options: [], discount: null, note: '', ...rest });

async function setup() {
  const { store, owner } = await ensureLocalStore();
  const salesMode = (await localDb.salesModes.where('storeId').equals(store.id).toArray()).find((m) => m.isDefault);
  const cash = (await localDb.paymentMethods.where('storeId').equals(store.id).toArray()).find((m) => m.type === 'cash');
  if (!salesMode || !cash) throw new Error('seed missing');
  return { store, ctx: { store, salesMode, cashierId: owner.id }, cash };
}
const cartOf = (items: OrderItem[]) => ({ openOrderId: null, items, orderDiscount: null, customerId: null, label: '' });

describe('selling by weight and at a typed price (ADR-011)', () => {
  it('stores a weighed, re-priced line and totals it in whole Rupiah', async () => {
    const { ctx, cash } = await setup();
    const byAmount = quantityForAmount(10_000, 30_000) ?? 0;
    const order = await completeOrder(
      cartOf([
        item({ unit: 'kg', qty: 0.75, unitPrice: 45_000, listPrice: 40_000, unitCost: 30_000 }), // 33.750
        item({ id: 'i2', productId: 'p-bawang', nameSnapshot: 'Bawang', unit: 'kg', qty: byAmount, unitPrice: 30_000 }), // exactly 10.000
        item({ id: 'i3', productId: 'p-kerupuk', nameSnapshot: 'Kerupuk', unitPrice: 2_000, qty: 2 }),
      ]),
      ctx,
      { method: cash, amount: 47_750, cashReceived: 50_000 },
    );
    expect(order.totals.grandTotal).toBe(33_750 + 10_000 + 4_000);
    expect(order.items[0]).toMatchObject({ unit: 'kg', qty: 0.75, unitPrice: 45_000, listPrice: 40_000 });

    const report = buildReport({ store: ctx.store, range: { from: order.businessDate, to: order.businessDate }, sales: [order], refunds: [], ordersById: new Map([[order.id, order]]), memberName: new Map() });
    expect(report.summary.itemsSold).toBe(4); // two weighed lines + two pieces
    expect(report.products.find((p) => p.productId === 'p-cabai')).toMatchObject({ qty: 0.75, unit: 'kg', revenue: 33_750 });
    expect(report.products.find((p) => p.productId === 'p-bawang')?.qty).toBe(0.333);

    const profit = buildProfit({ sales: [order], summary: report.summary, expenses: [] });
    expect(profit).toMatchObject({ mode: 'cost', cogs: 22_500, uncostedQty: 3 });

    const rows = itemRows({ input: { store: ctx.store, range: report.range, sales: [order], refunds: [], ordersById: new Map(), memberName: new Map() }, timeZone: 'Asia/Jakarta' });
    const cells = Object.fromEntries(ITEM_COLUMNS.map((c) => [c.header, c.value(rows[0] as (typeof rows)[number])]));
    expect(cells).toMatchObject({ Qty: 0.75, Satuan: 'kg', 'Harga Satuan': 45_000, 'Harga Normal': 40_000, 'Total Baris': 33_750 });
  });

  it('refunds a weighed line whole and ends fully refunded', async () => {
    const { ctx, cash } = await setup();
    const order = await completeOrder(cartOf([item({ unit: 'kg', qty: 0.75 }), item({ id: 'i3', nameSnapshot: 'Kerupuk', unitPrice: 2_000, qty: 2 })]), ctx, { method: cash, amount: 34_000, cashReceived: 34_000 });
    const first = buildRefundItems(order, [{ orderItemId: 'i1', qty: 0.75 }], []);
    expect(first.amount).toBe(30_000);
    expect(() => buildRefundItems(order, [{ orderItemId: 'i1', qty: 0.75 }], [first])).toThrow(/maksimal 0/);
    const rest = buildRefundItems(order, [{ orderItemId: 'i3', qty: 2 }], [first]);
    expect(first.amount + rest.amount).toBe(order.totals.grandTotal);
    expect(isFullyRefunded(order, [first, rest])).toBe(true);
  });

  it('rejects impossible quantities and prices', async () => {
    const { ctx, cash } = await setup();
    const pay = { method: cash, amount: 0, cashReceived: 1_000_000 };
    for (const bad of [{ qty: 0 }, { qty: -1 }, { qty: Number.NaN }, { qty: 10_000 }, { unitPrice: -5 }, { unitPrice: 10.5 }]) {
      await expect(completeOrder(cartOf([item(bad)]), ctx, pay), JSON.stringify(bad)).rejects.toThrow(/tidak valid/);
    }
  });
});

describe('cart rules for measured and flexible-price lines', () => {
  const add = useCartStore.getState().addItem;
  const base = { productId: 'p-cabai', name: 'Cabai Merah', unitPrice: 40_000, options: [] };

  it('keeps every weighing and every flexible-price entry as its own line; plain items still merge', () => {
    add({ ...base, unit: 'kg', qty: 0.5 });
    add({ ...base, unit: 'kg', qty: 0.25 });
    add({ productId: 'p-jasa', name: 'Jasa', unitPrice: 15_000, options: [], listPrice: 10_000 });
    add({ productId: 'p-jasa', name: 'Jasa', unitPrice: 10_000, options: [], listPrice: 10_000 });
    add({ productId: 'p-kerupuk', name: 'Kerupuk', unitPrice: 2_000, options: [] });
    add({ productId: 'p-kerupuk', name: 'Kerupuk', unitPrice: 2_000, options: [] });
    expect(useCartStore.getState().items.map((i) => [i.nameSnapshot, i.qty])).toEqual([['Cabai Merah', 0.5], ['Cabai Merah', 0.25], ['Jasa', 1], ['Jasa', 1], ['Kerupuk', 2]]);
  });

  it('a sales-mode change keeps a hand-typed price and refreshes the normal price', () => {
    add({ productId: 'p-jasa', name: 'Jasa', unitPrice: 15_000, options: [], listPrice: 10_000 }); // changed by the seller
    add({ productId: 'p-ikan', name: 'Ikan', unitPrice: 50_000, options: [], listPrice: 50_000, unit: 'kg', qty: 1.2 }); // normal price
    add({ productId: 'p-kerupuk', name: 'Kerupuk', unitPrice: 2_000, options: [] });
    useCartStore.getState().repriceItems((line) => Math.round((line.listPrice ?? line.unitPrice) * 1.2));
    expect(useCartStore.getState().items.map((i) => [i.unitPrice, i.listPrice])).toEqual([[15_000, 12_000], [60_000, 60_000], [2_400, undefined]]);

    const [first] = useCartStore.getState().items;
    if (!first) throw new Error('cart empty');
    useCartStore.getState().updateItem(first.id, { qty: 1, unitPrice: 9_000 });
    expect(useCartStore.getState().items[0]).toMatchObject({ unitPrice: 9_000, listPrice: 12_000 });
  });
});
