import { describe, expect, it } from 'vitest';
import type { OrderItem, Product, SalesMode } from '../types';
import {
  calculateChange,
  calculateTotals,
  discountAmount,
  isUsingFallbackPrice,
  resolveModePrice,
  unitPriceWithOptions,
} from './pricing';

const meta = { storeId: 's1', createdAt: '', updatedAt: '' };

const esTeh: Product = {
  ...meta,
  id: 'p1',
  categoryId: null,
  name: 'Es Teh',
  basePrice: 5_000,
  isActive: true,
  sortOrder: 0,
  variantGroupIds: [],
  modePrices: { takeaway: 6_000 },
};

const mode = (overrides: Partial<SalesMode>): SalesMode => ({
  ...meta,
  id: 'dine-in',
  name: 'Dine In',
  isDefault: true,
  isActive: true,
  priceRule: 'none',
  markupPct: 0,
  sortOrder: 0,
  ...overrides,
});

const item = (overrides: Partial<OrderItem>): OrderItem => ({
  id: 'i1',
  productId: 'p1',
  nameSnapshot: 'Es Teh',
  unitPrice: 5_000,
  qty: 1,
  options: [],
  discount: null,
  note: '',
  ...overrides,
});

const noTax = { taxPct: 0, servicePct: 0, isTaxInclusive: false };

describe('resolveModePrice', () => {
  it('uses base price for rule none', () => {
    expect(resolveModePrice(esTeh, mode({}))).toBe(5_000);
  });

  it('uses per-product takeaway price when set', () => {
    const takeaway = mode({ id: 'takeaway', priceRule: 'mode_price' });
    expect(resolveModePrice(esTeh, takeaway)).toBe(6_000);
    expect(isUsingFallbackPrice(esTeh, takeaway)).toBe(false);
  });

  it('falls back to base price when override is missing', () => {
    const gofood = mode({ id: 'gofood', priceRule: 'mode_price' });
    expect(resolveModePrice(esTeh, gofood)).toBe(5_000);
    expect(isUsingFallbackPrice(esTeh, gofood)).toBe(true);
  });

  it('applies markup percent and rounds to whole rupiah', () => {
    expect(resolveModePrice(esTeh, mode({ priceRule: 'markup', markupPct: 25 }))).toBe(6_250);
  });
});

describe('unitPriceWithOptions', () => {
  it('adds option deltas', () => {
    const jumbo = { groupId: 'g', optionId: 'o', name: 'Jumbo', priceDelta: 3_000 };
    expect(unitPriceWithOptions(5_000, [jumbo])).toBe(8_000);
  });
});

describe('discountAmount', () => {
  it('never exceeds the base', () => {
    expect(discountAmount(5_000, { discountId: null, name: 'x', type: 'fixed', value: 9_000 })).toBe(5_000);
  });

  it('calculates percent', () => {
    expect(discountAmount(20_000, { discountId: null, name: 'x', type: 'percent', value: 10 })).toBe(2_000);
  });
});

describe('calculateTotals', () => {
  it('applies item then order discounts', () => {
    const items = [
      item({ qty: 2 }),
      item({ id: 'i2', unitPrice: 15_000, discount: { discountId: null, name: 'Promo', type: 'fixed', value: 3_000 } }),
    ];
    const totals = calculateTotals(items, { discountId: null, name: 'Jumat', type: 'percent', value: 10 }, noTax);
    expect(totals).toEqual({
      subtotal: 25_000,
      itemDiscountTotal: 3_000,
      orderDiscountTotal: 2_200,
      serviceTotal: 0,
      taxTotal: 0,
      grandTotal: 19_800,
    });
  });

  it('adds service then exclusive tax', () => {
    const totals = calculateTotals([item({ unitPrice: 100_000 })], null, {
      taxPct: 10,
      servicePct: 5,
      isTaxInclusive: false,
    });
    expect(totals.serviceTotal).toBe(5_000);
    expect(totals.taxTotal).toBe(10_500);
    expect(totals.grandTotal).toBe(115_500);
  });

  it('extracts inclusive tax without changing the total', () => {
    const totals = calculateTotals([item({ unitPrice: 110_000 })], null, {
      taxPct: 10,
      servicePct: 0,
      isTaxInclusive: true,
    });
    expect(totals.grandTotal).toBe(110_000);
    expect(totals.taxTotal).toBe(10_000);
  });
});

describe('calculateChange', () => {
  it('returns change or null when short', () => {
    expect(calculateChange(19_800, 50_000)).toBe(30_200);
    expect(calculateChange(19_800, 10_000)).toBeNull();
  });
});
