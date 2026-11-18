import { describe, expect, it } from 'vitest';
import type { Order } from '../types';
import { buildReceiptText, whatsAppShareUrl } from './receiptText';

const order: Order = {
  id: 'o1',
  storeId: 's1',
  createdAt: '',
  updatedAt: '',
  receiptNo: 'INV-20261118-A10001',
  status: 'paid',
  salesModeId: 'm1',
  salesModeNameSnapshot: 'Takeaway',
  customerId: null,
  label: '',
  items: [
    {
      id: 'i1',
      productId: 'p1',
      nameSnapshot: 'Bakso Urat',
      unitPrice: 19_000,
      qty: 2,
      options: [{ groupId: 'g', optionId: 'o', name: 'Telur', priceDelta: 3_000 }],
      discount: null,
      note: 'kuah pisah',
    },
  ],
  orderDiscount: null,
  payments: [
    {
      id: 'pay1',
      paymentMethodId: 'pm1',
      methodNameSnapshot: 'Tunai',
      methodType: 'cash',
      amount: 38_000,
      cashReceived: 50_000,
      change: 12_000,
    },
  ],
  totals: { subtotal: 38_000, itemDiscountTotal: 0, orderDiscountTotal: 0, serviceTotal: 0, taxTotal: 0, grandTotal: 38_000 },
  cashierId: 'c1',
  businessDate: '2026-11-18',
  openedAt: '',
  paidAt: '',
};

describe('buildReceiptText', () => {
  const text = buildReceiptText(order, { name: 'Bakso Pak Budi', address: '', phone: '', receiptFooter: 'Terima kasih' });

  it('includes items, options, note, total, cash and change', () => {
    expect(text).toContain('2x Bakso Urat');
    expect(text).toContain('Telur');
    expect(text).toContain('Catatan: kuah pisah');
    expect(text).toMatch(/Total\s+Rp\s?38\.000/);
    expect(text).toMatch(/Kembali\s+Rp\s?12\.000/);
  });

  it('omits empty discount and tax lines', () => {
    expect(text).not.toContain('Diskon');
    expect(text).not.toContain('Pajak');
  });
});

describe('whatsAppShareUrl', () => {
  it('url-encodes the text', () => {
    expect(whatsAppShareUrl('a b\n*c*')).toBe('https://wa.me/?text=a%20b%0A*c*');
  });
});
