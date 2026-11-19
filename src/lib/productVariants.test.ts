import { describe, expect, it } from 'vitest';
import type { Product, ProductVariant, SalesMode } from '../types';
import { fromPrice, isProductSoldOut, lineName, priceTarget, validateVariants, variantPrice } from './productVariants';

const v = (name: string, price: number, rest: Partial<ProductVariant> = {}): ProductVariant => ({ id: `v-${name}`, name, price, sortOrder: 0, ...rest });
const kopi: Product = {
  id: 'p', storeId: 's', createdAt: '', updatedAt: '', categoryId: null, name: 'Kopi', basePrice: 18_000, isActive: true, sortOrder: 0,
  variantGroupIds: [], modePrices: { takeaway: 99_999 }, costPrice: 5_000,
  variants: [v('Latte', 25_000, { modePrices: { takeaway: 26_000 }, costPrice: 8_000, sortOrder: 1 }), v('Espresso', 18_000, { sortOrder: 0 })],
};
const mode = (priceRule: SalesMode['priceRule'], id = 'm', markupPct = 0) => ({ id, priceRule, markupPct }) as SalesMode;

describe('product variants (ADR-012)', () => {
  it('prices a variant with the same rules as a product', () => {
    const [latte, espresso] = kopi.variants as [ProductVariant, ProductVariant];
    expect(variantPrice(kopi, latte, mode('none'))).toBe(25_000);
    expect(variantPrice(kopi, latte, mode('mode_price', 'takeaway'))).toBe(26_000);
    expect(variantPrice(kopi, espresso, mode('mode_price', 'takeaway'))).toBe(18_000); // no own takeaway price → its full price, never the product's
    expect(variantPrice(kopi, latte, mode('markup', 'ojol', 20))).toBe(30_000);
    expect(priceTarget(kopi, espresso).costPrice).toBe(5_000); // falls back to the product's cost
    expect(priceTarget(kopi, latte).costPrice).toBe(8_000);
  });

  it('shows the cheapest variant and names lines "Product – Variant"', () => {
    expect(fromPrice(kopi, mode('none'))).toBe(18_000);
    expect(fromPrice({ ...kopi, variants: [] }, mode('none'))).toBe(18_000);
    expect([lineName(kopi, { name: 'Latte' }), lineName(kopi, undefined)]).toEqual(['Kopi – Latte', 'Kopi']);
  });

  it('is sold out only when the product is, or every variant is', () => {
    expect(isProductSoldOut(kopi)).toBe(false);
    expect(isProductSoldOut({ ...kopi, variants: kopi.variants?.map((x, i) => ({ ...x, isSoldOut: i === 0 })) })).toBe(false);
    expect(isProductSoldOut({ ...kopi, variants: kopi.variants?.map((x) => ({ ...x, isSoldOut: true })) })).toBe(true);
    expect(isProductSoldOut({ ...kopi, isSoldOut: true })).toBe(true);
  });

  it('validates names and prices', () => {
    expect(validateVariants([])).toBeNull();
    expect(validateVariants([v('Latte', 1), v(' latte ', 2)])).toMatch(/dua kali/);
    expect(validateVariants([v(' ', 1)])).toMatch(/wajib/);
    expect(validateVariants([v('Latte', -1)])).toMatch(/tidak valid/);
    expect(validateVariants([v('Latte', 1, { modePrices: { t: 1.5 } })])).toMatch(/tidak valid/);
    expect(validateVariants(Array.from({ length: 21 }, (_, i) => v(`V${i}`, 1)))).toMatch(/Maksimal 20/);
  });
});
