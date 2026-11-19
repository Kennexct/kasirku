import { describe, expect, it } from 'vitest';
import type { AppliedDiscount, OrderItem } from '../types';
import { calculateTotals, lineGross, lineTotal } from './pricing';
import { countUnits, formatLineQty, formatQuantity, hasPriceChange, parseQuantity, quantityForAmount, roundQuantity } from './quantity';

const line = (unitPrice: number, qty: number, rest: Partial<OrderItem> = {}): OrderItem =>
  ({ id: 'i', productId: 'p', nameSnapshot: 'Cabai', unitPrice, qty, options: [], discount: null, note: '', ...rest });

describe('measured quantities (ADR-011)', () => {
  it('reads weights typed with a comma or a dot, to 3 decimals', () => {
    expect([parseQuantity('0,75'), parseQuantity('0.75'), parseQuantity(' 2 '), parseQuantity(',5'), parseQuantity('1.')]).toEqual([0.75, 0.75, 2, 0.5, 1]);
    expect(parseQuantity('0,3336')).toBe(0.334);
    expect([parseQuantity(''), parseQuantity('0'), parseQuantity('-1'), parseQuantity('1,2,3'), parseQuantity('abc'), parseQuantity('10000')]).toEqual([null, null, null, null, null, null]);
  });

  it('prices a weighed line in whole Rupiah', () => {
    expect(lineGross(line(40_000, 0.75))).toBe(30_000);
    expect(lineGross(line(38_500, 0.333))).toBe(12_821); // 12 820,5 rounds up
    expect(lineGross(line(15_000, 2))).toBe(30_000); // pieces unchanged
  });

  it('"beli Rp10.000" charges exactly Rp10.000 whatever the price per kg', () => {
    for (const price of [30_000, 38_500, 47_000, 125_000, 999_999, 7_300]) {
      const qty = quantityForAmount(10_000, price);
      if (qty === null) throw new Error('expected a quantity');
      expect(lineGross(line(price, qty)), `price ${price}`).toBe(10_000);
    }
    expect(formatQuantity(quantityForAmount(10_000, 30_000) ?? 0, 'kg')).toBe('0,333 kg');
    expect([quantityForAmount(10_000, 0), quantityForAmount(0, 5_000), quantityForAmount(1_000_000_000, 1)]).toEqual([null, null, null]);
  });

  it('formats and counts pieces and weights', () => {
    expect([formatQuantity(2, undefined), formatQuantity(0.75, 'kg'), formatQuantity(250, 'g'), formatQuantity(1.5, 'l')]).toEqual(['2', '0,75 kg', '250 g', '1,5 L']);
    expect([formatLineQty(line(1, 3)), formatLineQty(line(1, 0.5, { unit: 'kg' }))]).toEqual(['3×', '0,5 kg']);
    expect(countUnits([line(1, 3), line(1, 0.75, { unit: 'kg' }), line(1, 250, { unit: 'g' })])).toBe(5);
    expect(roundQuantity(0.1 + 0.2)).toBe(0.3);
  });

  it('knows when the seller changed the price', () => {
    expect([hasPriceChange(line(45_000, 1, { listPrice: 40_000 })), hasPriceChange(line(40_000, 1, { listPrice: 40_000 })), hasPriceChange(line(40_000, 1))]).toEqual([true, false, false]);
  });

  it('keeps discounts, service and tax consistent on decimal quantities', () => {
    const discount: AppliedDiscount = { name: 'Promo', type: 'percent', value: 10 } as AppliedDiscount;
    const items = [line(40_000, 0.75, { unit: 'kg', discount }), line(2_000, 3)];
    expect(lineTotal(items[0] as OrderItem)).toBe(27_000);
    const totals = calculateTotals(items, null, { taxPct: 10, servicePct: 5, isTaxInclusive: false });
    expect(totals.subtotal).toBe(36_000);
    expect(Number.isInteger(totals.grandTotal)).toBe(true);
    expect(totals.grandTotal).toBe(totals.subtotal - totals.itemDiscountTotal - totals.orderDiscountTotal + totals.serviceTotal + totals.taxTotal);
  });
});
