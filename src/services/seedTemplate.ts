import { DEFAULT_PAYMENT_METHODS, DEFAULT_STORE_RULES } from '../constants';
import { nowIso, uuidv7 } from '../lib/id';
import type {
  Category,
  Discount,
  Id,
  PaymentMethod,
  Product,
  SalesMode,
  Store,
  StoreMember,
  SyncMeta,
  VariantGroup,
  VariantOption,
} from '../types';

/**
 * Starter "Warung Bakso" template (PRD risk: onboarding templates).
 * Gives a new seller a working menu they can edit instead of an empty screen.
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

const option = (name: string, priceDelta: number, sortOrder: number): VariantOption => ({
  id: uuidv7(),
  name,
  priceDelta,
  sortOrder,
});

export function buildSeedBundle(): SeedBundle {
  const storeId = uuidv7();
  const now = nowIso();
  const meta = (): SyncMeta => ({ id: uuidv7(), storeId, createdAt: now, updatedAt: now });

  const store: Store = {
    id: storeId,
    name: 'Warung Saya',
    address: '',
    phone: '',
    timezone: 'Asia/Jakarta',
    dayCutoff: '04:00',
    receiptHeader: '',
    receiptFooter: 'Terima kasih, sampai jumpa lagi!',
    receiptPaperMm: 58,
    taxPct: 0,
    servicePct: 0,
    isTaxInclusive: false,
    settings: { ...DEFAULT_STORE_RULES },
  };

  const owner: StoreMember = { ...meta(), userId: null, role: 'owner', displayName: 'Pemilik', pinHash: '' };

  const makanan: Category = { ...meta(), name: 'Makanan', sortOrder: 0 };
  const minuman: Category = { ...meta(), name: 'Minuman', sortOrder: 1 };

  const dineIn: SalesMode = {
    ...meta(), name: 'Dine In', isDefault: true, isActive: true, priceRule: 'none', markupPct: 0, sortOrder: 0,
  };
  const takeaway: SalesMode = {
    ...meta(), name: 'Takeaway', isDefault: false, isActive: true, priceRule: 'mode_price', markupPct: 0, sortOrder: 1,
  };
  const ojol: SalesMode = {
    ...meta(), name: 'GoFood/Grab', isDefault: false, isActive: false, priceRule: 'markup', markupPct: 20, sortOrder: 2,
  };

  const pedas: VariantGroup = {
    ...meta(), name: 'Level Pedas', isRequired: true, selectType: 'single', min: 1, max: 1,
    options: [option('Tidak pedas', 0, 0), option('Sedang', 0, 1), option('Pedas', 0, 2)],
  };
  const topping: VariantGroup = {
    ...meta(), name: 'Topping', isRequired: false, selectType: 'multi', min: 0, max: 3,
    options: [option('Telur', 3_000, 0), option('Tahu', 2_000, 1), option('Pangsit', 2_000, 2)],
  };
  const ukuran: VariantGroup = {
    ...meta(), name: 'Ukuran', isRequired: true, selectType: 'single', min: 1, max: 1,
    options: [option('Reguler', 0, 0), option('Jumbo', 3_000, 1)],
  };

  const product = (
    name: string,
    categoryId: Id,
    basePrice: number,
    takeawayPrice: number | null,
    groups: VariantGroup[],
    sortOrder: number,
  ): Product => ({
    ...meta(),
    categoryId,
    name,
    basePrice,
    isActive: true,
    sortOrder,
    variantGroupIds: groups.map((g) => g.id),
    modePrices: takeawayPrice === null ? {} : { [takeaway.id]: takeawayPrice },
  });

  const paymentMethods: PaymentMethod[] = DEFAULT_PAYMENT_METHODS.map((m, i) => ({
    ...meta(),
    name: m.name,
    type: m.type,
    referenceMode: m.referenceMode,
    referenceLabel: m.referenceLabel,
    isActive: true,
    sortOrder: i,
  }));

  return {
    store,
    owner,
    categories: [makanan, minuman],
    variantGroups: [pedas, topping, ukuran],
    salesModes: [dineIn, takeaway, ojol],
    paymentMethods,
    products: [
      product('Bakso Urat', makanan.id, 15_000, 16_000, [pedas, topping], 0),
      product('Mie Ayam', makanan.id, 13_000, 14_000, [pedas, topping], 1),
      product('Bakso Campur', makanan.id, 18_000, 19_000, [pedas], 2),
      product('Kerupuk', makanan.id, 2_000, null, [], 3),
      product('Es Teh', minuman.id, 5_000, 6_000, [ukuran], 4),
      product('Es Jeruk', minuman.id, 7_000, 8_000, [ukuran], 5),
      product('Air Mineral', minuman.id, 4_000, null, [], 6),
    ],
    discounts: [
      { ...meta(), name: 'Promo Jumat', scope: 'order', type: 'percent', value: 10, isActive: true },
      { ...meta(), name: 'Potongan Langganan', scope: 'order', type: 'fixed', value: 2_000, isActive: true },
    ],
  };
}
