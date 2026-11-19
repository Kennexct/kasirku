import { PERCENT_MAX } from '../constants';
import type {
  AppliedDiscount,
  OrderItem,
  OrderTotals,
  Product,
  Rupiah,
  SalesMode,
  SelectedOption,
  Store,
} from '../types';
import { toRupiah } from './money';

/**
 * Unit price of a product for a sales mode, before variant options.
 * - mode_price: per-product override if set, else base price
 * - markup: base price + markup % (e.g. ojol commission)
 */
export function resolveModePrice(product: Product, mode: SalesMode): Rupiah {
  if (mode.priceRule === 'mode_price') {
    return product.modePrices[mode.id] ?? product.basePrice;
  }
  if (mode.priceRule === 'markup') {
    return toRupiah(product.basePrice * (1 + mode.markupPct / PERCENT_MAX));
  }
  return product.basePrice;
}

/** True when the mode expects an override but this product has none. */
export function isUsingFallbackPrice(product: Product, mode: SalesMode): boolean {
  return mode.priceRule === 'mode_price' && product.modePrices[mode.id] === undefined;
}

export function unitPriceWithOptions(modePrice: Rupiah, options: readonly SelectedOption[]): Rupiah {
  return options.reduce((sum, option) => sum + option.priceDelta, modePrice);
}

/** Discount amount for a base, clamped so the result never goes below zero. */
export function discountAmount(base: Rupiah, discount: AppliedDiscount | null): Rupiah {
  if (!discount || base <= 0) return 0;
  const raw = discount.type === 'percent' ? (base * discount.value) / PERCENT_MAX : discount.value;
  return Math.min(base, Math.max(0, toRupiah(raw)));
}

/** The value of a line before discounts — the single definition. Whole Rupiah even for decimal quantities (ADR-011). */
export function lineGross(item: Pick<OrderItem, 'unitPrice' | 'qty'>): Rupiah {
  return Math.round(item.unitPrice * item.qty);
}

export function lineTotal(item: OrderItem): Rupiah {
  const gross = lineGross(item);
  return gross - discountAmount(gross, item.discount);
}

type TaxConfig = Pick<Store, 'taxPct' | 'servicePct' | 'isTaxInclusive'>;

/**
 * Order totals. Order: item discounts → order discount → service charge → tax.
 * When tax is inclusive, tax is extracted from the total rather than added.
 */
export function calculateTotals(
  items: readonly OrderItem[],
  orderDiscount: AppliedDiscount | null,
  tax: TaxConfig,
): OrderTotals {
  const subtotal = items.reduce((sum, item) => sum + lineGross(item), 0);
  const afterItemDiscounts = items.reduce((sum, item) => sum + lineTotal(item), 0);
  const itemDiscountTotal = subtotal - afterItemDiscounts;
  const orderDiscountTotal = discountAmount(afterItemDiscounts, orderDiscount);
  const net = afterItemDiscounts - orderDiscountTotal;
  const serviceTotal = toRupiah((net * tax.servicePct) / PERCENT_MAX);
  const taxable = net + serviceTotal;

  if (tax.isTaxInclusive) {
    const taxTotal = toRupiah(taxable - taxable / (1 + tax.taxPct / PERCENT_MAX));
    return { subtotal, itemDiscountTotal, orderDiscountTotal, serviceTotal, taxTotal, grandTotal: taxable };
  }

  const taxTotal = toRupiah((taxable * tax.taxPct) / PERCENT_MAX);
  return {
    subtotal,
    itemDiscountTotal,
    orderDiscountTotal,
    serviceTotal,
    taxTotal,
    grandTotal: taxable + taxTotal,
  };
}

/** Change for cash payments; null when cash received is not enough. */
export function calculateChange(total: Rupiah, cashReceived: Rupiah): Rupiah | null {
  return cashReceived >= total ? cashReceived - total : null;
}
