import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { localDb } from '../db/localDb';
import type { Order } from '../types';
import { ensureLocalStore } from './bootstrap';
import { createPaymentMethod, createSalesMode, deleteConfig, moveConfig, renameConfig } from './checkoutConfig';

beforeEach(async () => {
  await localDb.delete();
  await localDb.open();
});

const names = async (table: 'paymentMethods' | 'salesModes', storeId: string) =>
  (await localDb.table(table).where('storeId').equals(storeId).toArray())
    .filter((r) => !r.deletedAt)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((r) => r.name);

describe('payment methods', () => {
  it('creates at the end with sensible reference defaults and rejects duplicates', async () => {
    const { store } = await ensureLocalStore();
    const gopay = await createPaymentMethod(store.id, { name: ' GoPay ', type: 'ewallet' });
    expect(gopay).toMatchObject({ name: 'GoPay', referenceMode: 'optional', referenceLabel: 'No. Ref', isActive: true });
    expect((await createPaymentMethod(store.id, { name: 'Kas kecil', type: 'cash' })).referenceMode).toBe('off');
    expect(await names('paymentMethods', store.id)).toEqual(['Tunai', 'QRIS', 'Transfer Bank', 'GoPay', 'Kas kecil']);
    await expect(createPaymentMethod(store.id, { name: 'gopay', type: 'ewallet' })).rejects.toThrow(/sudah ada/);
    await expect(createPaymentMethod(store.id, { name: '  ', type: 'other' })).rejects.toThrow(/wajib/);
  });

  it('renames, moves and deletes — but never the last active method', async () => {
    const { store } = await ensureLocalStore();
    const methods = await localDb.paymentMethods.where('storeId').equals(store.id).sortBy('sortOrder');
    const [cash, qris, transfer] = methods;
    if (!cash || !qris || !transfer) throw new Error('seed missing');

    await renameConfig('paymentMethods', transfer.id, 'Transfer BCA');
    await expect(renameConfig('paymentMethods', transfer.id, 'qris')).rejects.toThrow(/sudah ada/);
    await moveConfig('paymentMethods', transfer.id, -1);
    await moveConfig('paymentMethods', cash.id, -1); // already first: no-op
    expect(await names('paymentMethods', store.id)).toEqual(['Tunai', 'Transfer BCA', 'QRIS']);

    await deleteConfig('paymentMethods', qris.id);
    await deleteConfig('paymentMethods', transfer.id);
    await expect(deleteConfig('paymentMethods', cash.id)).rejects.toThrow(/minimal satu metode/);
    expect(await names('paymentMethods', store.id)).toEqual(['Tunai']);
    expect((await localDb.paymentMethods.get(qris.id))?.deletedAt).toBeTruthy(); // kept for history
  });
});

describe('sales modes', () => {
  it('creates with a price rule and protects the default mode', async () => {
    const { store } = await ensureLocalStore();
    const shopee = await createSalesMode(store.id, { name: 'ShopeeFood', priceRule: 'markup', markupPct: 25 });
    expect(shopee).toMatchObject({ isDefault: false, isActive: true, markupPct: 25 });
    expect((await createSalesMode(store.id, { name: 'Pesan antar', priceRule: 'none', markupPct: 30 })).markupPct).toBe(0);
    await expect(createSalesMode(store.id, { name: 'Promo', priceRule: 'markup', markupPct: 150 })).rejects.toThrow(/0–100/);

    const dineIn = (await localDb.salesModes.where('storeId').equals(store.id).toArray()).find((m) => m.isDefault);
    if (!dineIn) throw new Error('seed missing');
    await expect(deleteConfig('salesModes', dineIn.id)).rejects.toThrow(/default/);

    // A saved, unpaid order priced in this mode blocks the delete until it is settled.
    await localDb.orders.add({ id: 'o1', storeId: store.id, status: 'open', salesModeId: shopee.id } as Order);
    await expect(deleteConfig('salesModes', shopee.id)).rejects.toThrow(/1 pesanan tersimpan/);
    await localDb.orders.update('o1', { status: 'paid' });
    await deleteConfig('salesModes', shopee.id);
    expect(await names('salesModes', store.id)).not.toContain('ShopeeFood');
  });
});
