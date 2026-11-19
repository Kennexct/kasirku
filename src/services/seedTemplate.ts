import { DEFAULT_PAYMENT_METHODS, DEFAULT_STORE_RULES } from '../constants';
import { nowIso, uuidv7 } from '../lib/id';
import type { Category, Discount, PaymentMethod, Product, SalesMode, Store, StoreMember, SyncMeta, VariantGroup } from '../types';
import { t } from '../i18n';

/**
 * Starter menus (ADR-009). A template is data: categories, variant groups and products that reference them by key.
 * One builder turns a template plus the merchant's choices into everything a new store needs.
 */
export interface SeedBundle {
  store: Store;
  owner: StoreMember;
  categories: Category[];
  variantGroups: VariantGroup[];
  salesModes: SalesMode[];
  paymentMethods: PaymentMethod[];
  products: Product[];
  discounts: Discount[];
}

export const TEMPLATE_IDS = ['bakso', 'kopi', 'gorengan', 'warung', 'kosong'] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export interface SeedSetup {
  storeName: string;
  template: TemplateId;
  hasQris: boolean;
  hasTransfer: boolean;
  qrisImageUrl?: string;
}

export const DEFAULT_SETUP: SeedSetup = { storeName: t('Warung Saya'), template: 'bakso', hasQris: true, hasTransfer: true };
export const STORE_NAME_MAX = 60;

type GroupDef = { name: string; isRequired: boolean; max: number; options: ReadonlyArray<readonly [name: string, priceDelta: number]> };
/** name, category key, base price, takeaway price (null = same as base), variant group keys */
/** name, price, takeaway price (null = same) */
type VariantDef = readonly [name: string, price: number, takeawayPrice: number | null];
type ProductDef = readonly [name: string, category: string, basePrice: number, takeawayPrice: number | null, groups: readonly string[], variants?: readonly VariantDef[]];

interface TemplateDef {
  label: string;
  description: string;
  categories: Record<string, string>;
  groups: Record<string, GroupDef>;
  products: readonly ProductDef[];
}

const single = (name: string, options: GroupDef['options']): GroupDef => ({ name, isRequired: true, max: 1, options });
const PEDAS = single(t('Level Pedas'), [[t('Tidak pedas'), 0], [t('Sedang'), 0], [t('Pedas'), 0]]);

export const TEMPLATES: Record<TemplateId, TemplateDef> = {
  bakso: {
    label: t('Bakso & mie'),
    description: t('Bakso, mie ayam, minuman'),
    categories: { makanan: t('Makanan'), minuman: t('Minuman') },
    groups: {
      pedas: PEDAS,
      topping: { name: t('Topping'), isRequired: false, max: 3, options: [[t('Telur'), 3_000], [t('Tahu'), 2_000], [t('Pangsit'), 2_000]] },
      ukuran: single(t('Ukuran'), [[t('Reguler'), 0], [t('Jumbo'), 3_000]]),
    },
    products: [
      ['Bakso Urat', 'makanan', 15_000, 16_000, ['pedas', 'topping']],
      ['Mie Ayam', 'makanan', 13_000, 14_000, ['pedas', 'topping']],
      ['Bakso Campur', 'makanan', 18_000, 19_000, ['pedas']],
      ['Kerupuk', 'makanan', 2_000, null, []],
      ['Es Teh', 'minuman', 5_000, 6_000, ['ukuran']],
      ['Es Jeruk', 'minuman', 7_000, 8_000, ['ukuran']],
      ['Air Mineral', 'minuman', 4_000, null, []],
    ],
  },
  kopi: {
    label: t('Kopi & minuman'),
    description: t('Kedai kopi, es, camilan'),
    categories: { kopi: t('Kopi'), nonkopi: t('Non-kopi'), camilan: t('Camilan') },
    // ADR-012: drinks have variants (each its own price); ice, sugar and size are add-ons.
    groups: {
      es: single(t('Es'), [[t('Es normal'), 0], [t('Sedikit es'), 0], [t('Tanpa es'), 0], [t('Panas'), 0]]),
      gula: single(t('Gula'), [[t('Gula normal'), 0], [t('Sedikit gula'), 0], [t('Tanpa gula'), 0]]),
      ukuran: single(t('Ukuran'), [['Tall', 0], ['Grande', 4_000], ['Venti', 7_000]]),
    },
    products: [
      ['Kopi', 'kopi', 15_000, null, ['es', 'gula', 'ukuran'], [
        ['Americano', 18_000, 19_000],
        ['Latte', 25_000, 26_000],
        ['Cappuccino', 25_000, 26_000],
        ['Espresso', 15_000, 16_000],
        ['Kopi Susu Gula Aren', 20_000, 21_000],
      ]],
      ['Teh', 'nonkopi', 15_000, null, ['es', 'gula', 'ukuran'], [
        ['Teh Tarik', 15_000, 16_000],
        ['Lemon Tea', 15_000, 16_000],
        ['Matcha Latte', 25_000, 26_000],
      ]],
      ['Cokelat', 'nonkopi', 22_000, 23_000, ['es', 'gula', 'ukuran']],
      ['Roti Bakar', 'camilan', 15_000, null, []],
      ['Kentang Goreng', 'camilan', 15_000, null, []],
    ],
  },
  gorengan: {
    label: t('Gorengan & jajanan'),
    description: t('Gorengan, kue, minuman'),
    categories: { gorengan: t('Gorengan'), minuman: t('Minuman') },
    groups: {},
    products: [
      ['Tahu Isi', 'gorengan', 2_000, null, []],
      ['Tempe Mendoan', 'gorengan', 2_000, null, []],
      ['Bakwan', 'gorengan', 2_000, null, []],
      ['Pisang Goreng', 'gorengan', 2_500, null, []],
      ['Cireng', 'gorengan', 2_000, null, []],
      ['Risoles', 'gorengan', 3_000, null, []],
      ['Es Teh', 'minuman', 4_000, null, []],
      ['Air Mineral', 'minuman', 4_000, null, []],
    ],
  },
  warung: {
    label: t('Warung makan'),
    description: t('Nasi, lauk, minuman'),
    categories: { nasi: t('Nasi & lauk'), minuman: t('Minuman') },
    groups: {
      pedas: PEDAS,
      nasi: single(t('Porsi nasi'), [[t('Biasa'), 0], [t('Setengah'), 0], [t('Tambah nasi'), 3_000]]),
    },
    products: [
      ['Nasi Ayam Goreng', 'nasi', 18_000, 19_000, ['nasi', 'pedas']],
      ['Nasi Lele', 'nasi', 17_000, 18_000, ['nasi', 'pedas']],
      ['Nasi Rames', 'nasi', 15_000, 16_000, ['nasi']],
      ['Nasi Telur', 'nasi', 12_000, 13_000, ['nasi', 'pedas']],
      ['Sayur', 'nasi', 5_000, null, []],
      ['Tempe / Tahu', 'nasi', 2_000, null, []],
      ['Es Teh', 'minuman', 4_000, null, []],
      ['Teh Hangat', 'minuman', 3_000, null, []],
    ],
  },
  kosong: { label: t('Mulai kosong'), description: t('Isi menu sendiri dari awal'), categories: {}, groups: {}, products: [] },
};

export function buildSeedBundle(setup: SeedSetup = DEFAULT_SETUP): SeedBundle {
  const storeId = uuidv7();
  const now = nowIso();
  const meta = (): SyncMeta => ({ id: uuidv7(), storeId, createdAt: now, updatedAt: now });
  const template = TEMPLATES[setup.template];

  const store: Store = {
    id: storeId,
    name: setup.storeName.trim().slice(0, STORE_NAME_MAX) || DEFAULT_SETUP.storeName,
    address: '',
    phone: '',
    timezone: 'Asia/Jakarta',
    dayCutoff: '04:00',
    receiptHeader: '',
    receiptFooter: t('Terima kasih, sampai jumpa lagi!'),
    receiptPaperMm: 58,
    taxPct: 0,
    servicePct: 0,
    isTaxInclusive: false,
    settings: { ...DEFAULT_STORE_RULES },
  };
  const owner: StoreMember = { ...meta(), userId: null, role: 'owner', displayName: t('Pemilik'), pinHash: '' };

  const mode = (name: string, sortOrder: number, rest: Pick<SalesMode, 'isDefault' | 'isActive' | 'priceRule' | 'markupPct'>): SalesMode => ({ ...meta(), name, sortOrder, ...rest });
  const dineIn = mode('Dine In', 0, { isDefault: true, isActive: true, priceRule: 'none', markupPct: 0 });
  const takeaway = mode('Takeaway', 1, { isDefault: false, isActive: true, priceRule: 'mode_price', markupPct: 0 });
  const ojol = mode('GoFood/Grab', 2, { isDefault: false, isActive: false, priceRule: 'markup', markupPct: 20 });

  const categories = new Map(Object.entries(template.categories).map(([key, name], sortOrder) => [key, { ...meta(), name, sortOrder } satisfies Category]));
  const groups = new Map(
    Object.entries(template.groups).map(([key, def]) => {
      const group: VariantGroup = {
        ...meta(),
        name: def.name,
        isRequired: def.isRequired,
        selectType: def.max === 1 ? 'single' : 'multi',
        min: def.isRequired ? 1 : 0,
        max: def.max,
        options: def.options.map(([name, priceDelta], sortOrder) => ({ id: uuidv7(), name, priceDelta, sortOrder })),
      };
      return [key, group] as const;
    }),
  );

  const products = template.products.map(([name, category, basePrice, takeawayPrice, groupKeys, variantDefs], sortOrder): Product => ({
    ...meta(),
    ...(variantDefs
      ? {
          variants: variantDefs.map(([variantName, price, variantTakeaway], variantOrder) => ({
            id: uuidv7(),
            name: variantName,
            price,
            ...(variantTakeaway === null ? {} : { modePrices: { [takeaway.id]: variantTakeaway } }),
            sortOrder: variantOrder,
          })),
        }
      : {}),
    categoryId: categories.get(category)?.id ?? null,
    name,
    basePrice: variantDefs ? Math.min(...variantDefs.map(([, price]) => price)) : basePrice,
    isActive: true,
    sortOrder,
    variantGroupIds: groupKeys.flatMap((key) => groups.get(key)?.id ?? []),
    modePrices: takeawayPrice === null ? {} : { [takeaway.id]: takeawayPrice },
  }));

  const wanted = DEFAULT_PAYMENT_METHODS.filter((m) => m.type === 'cash' || (m.type === 'qris' && setup.hasQris) || (m.type === 'transfer' && setup.hasTransfer));
  const paymentMethods = wanted.map((m, sortOrder): PaymentMethod => ({
    ...meta(),
    name: m.name,
    type: m.type,
    referenceMode: m.referenceMode,
    referenceLabel: m.referenceLabel,
    ...(m.type === 'qris' && setup.qrisImageUrl ? { qrisImageUrl: setup.qrisImageUrl } : {}),
    isActive: true,
    sortOrder,
  }));

  return {
    store,
    owner,
    categories: [...categories.values()],
    variantGroups: [...groups.values()],
    salesModes: [dineIn, takeaway, ojol],
    paymentMethods,
    products,
    discounts: [
      { ...meta(), name: t('Promo Jumat'), scope: 'order', type: 'percent', value: 10, isActive: true },
      { ...meta(), name: t('Potongan Langganan'), scope: 'order', type: 'fixed', value: 2_000, isActive: true },
    ],
  };
}
