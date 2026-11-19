import { describe, expect, it } from 'vitest';
import { buildSeedBundle, DEFAULT_SETUP, TEMPLATE_IDS, TEMPLATES } from './seedTemplate';

describe('starter templates', () => {
  it.each(TEMPLATE_IDS)('%s: every product points at a category and variant groups that exist', (template) => {
    const bundle = buildSeedBundle({ ...DEFAULT_SETUP, template });
    const def = TEMPLATES[template];
    const categoryIds = new Set(bundle.categories.map((c) => c.id));
    const groupIds = new Set(bundle.variantGroups.map((g) => g.id));

    expect(bundle.products).toHaveLength(def.products.length);
    expect(new Set(bundle.products.map((p) => p.name)).size).toBe(bundle.products.length);
    for (const [index, product] of bundle.products.entries()) {
      expect(product.categoryId && categoryIds.has(product.categoryId)).toBe(true);
      expect(product.variantGroupIds).toHaveLength(def.products[index]?.[4].length ?? -1);
      expect(product.variantGroupIds.every((id) => groupIds.has(id))).toBe(true);
      expect(product.basePrice).toBeGreaterThan(0);
    }
    for (const group of bundle.variantGroups) expect(group.options.length).toBeGreaterThanOrEqual(group.min);
    expect(bundle.salesModes.filter((m) => m.isDefault)).toHaveLength(1);
  });

  it('applies the merchant choices: name, payment methods, QRIS image', () => {
    const bundle = buildSeedBundle({ storeName: '  Kopi Senja  ', template: 'kopi', hasQris: true, hasTransfer: false, qrisImageUrl: 'data:image/webp;base64,AAAA' });
    expect(bundle.store.name).toBe('Kopi Senja');
    expect(bundle.paymentMethods.map((m) => m.type)).toEqual(['cash', 'qris']);
    expect(bundle.paymentMethods.find((m) => m.type === 'qris')?.qrisImageUrl).toContain('data:image/webp');
    expect(buildSeedBundle({ ...DEFAULT_SETUP, storeName: ' ', hasQris: false, hasTransfer: false })).toMatchObject({ store: { name: 'Warung Saya' }, paymentMethods: [{ type: 'cash' }] });
  });

  it('an empty start has no menu but can still take payment', () => {
    const bundle = buildSeedBundle({ ...DEFAULT_SETUP, template: 'kosong' });
    expect([bundle.products.length, bundle.categories.length, bundle.variantGroups.length]).toEqual([0, 0, 0]);
    expect(bundle.paymentMethods.length).toBeGreaterThan(0);
  });
});
