import { DATE_LOCALE, t } from '../i18n';
import type { OrderItem, Rupiah, SaleUnit } from '../types';

/**
 * Quantities for products sold by weight or measure (ADR-011).
 * Pieces are whole numbers; measured units are decimals shown with at most 3 places.
 */
export const SALE_UNITS: readonly SaleUnit[] = ['pcs', 'kg', 'ons', 'g', 'l', 'm'];
export const QUANTITY_DECIMALS = 3;
export const MAX_QUANTITY = 9_999;

interface UnitInfo {
  /** Short form after a number: "0,75 kg". Empty for pieces. */
  symbol: string;
  /** Name in the product form. */
  label: string;
  /** Quick buttons in the entry sheet. */
  quick: readonly number[];
}

export const UNIT_INFO: Record<SaleUnit, UnitInfo> = {
  pcs: { symbol: '', label: t('Satuan (pcs)'), quick: [] },
  kg: { symbol: 'kg', label: t('Kilogram (kg)'), quick: [0.25, 0.5, 1] },
  ons: { symbol: 'ons', label: t('Ons (100 g)'), quick: [1, 2, 5] },
  g: { symbol: 'g', label: t('Gram (g)'), quick: [100, 250, 500] },
  l: { symbol: 'L', label: t('Liter (L)'), quick: [0.25, 0.5, 1] },
  m: { symbol: 'm', label: t('Meter (m)'), quick: [0.5, 1, 2] },
};

export const isMeasured = (unit: SaleUnit | undefined): boolean => unit !== undefined && unit !== 'pcs';

const SCALE = 10 ** QUANTITY_DECIMALS;
export const roundQuantity = (qty: number): number => Math.round(qty * SCALE) / SCALE;

/** Reads what a seller typed: "0,75", "0.75", "1 1/2" is not supported. Returns null when it is not a positive number in range. */
export function parseQuantity(text: string): number | null {
  const cleaned = text.trim().replace(',', '.');
  if (!/^\d*\.?\d+$|^\d+\.$/.test(cleaned)) return null;
  const value = roundQuantity(Number(cleaned));
  return Number.isFinite(value) && value > 0 && value <= MAX_QUANTITY ? value : null;
}

/**
 * "Beli Rp10.000": the quantity that amount buys. Kept at full precision so that
 * round(price × quantity) is exactly the amount; it is only displayed with 3 decimals.
 */
export function quantityForAmount(amount: Rupiah, unitPrice: Rupiah): number | null {
  if (unitPrice <= 0 || amount <= 0) return null;
  const qty = amount / unitPrice;
  return qty <= MAX_QUANTITY ? qty : null;
}

const numberFormat = new Intl.NumberFormat(DATE_LOCALE, { maximumFractionDigits: QUANTITY_DECIMALS });

/** "2" for pieces, "0,75 kg" for a measured unit. */
export function formatQuantity(qty: number, unit: SaleUnit | undefined): string {
  const symbol = UNIT_INFO[unit ?? 'pcs'].symbol;
  return symbol ? `${numberFormat.format(qty)} ${symbol}` : numberFormat.format(qty);
}

/** "2×" / "0,75 kg" — the quantity as it prefixes an item name in lists. */
export const formatLineQty = (item: Pick<OrderItem, 'qty' | 'unit'>): string =>
  isMeasured(item.unit) ? formatQuantity(item.qty, item.unit) : `${formatQuantity(item.qty, undefined)}×`;

/** "per kg" suffix for price labels; empty for pieces. */
export const perUnit = (unit: SaleUnit | undefined): string => (isMeasured(unit) ? `/${UNIT_INFO[unit ?? 'pcs'].symbol}` : '');

/** How many "items" a set of lines is: pieces count by quantity, a measured line counts once. */
export function countUnits(items: ReadonlyArray<Pick<OrderItem, 'qty' | 'unit'>>): number {
  return items.reduce((sum, item) => sum + (isMeasured(item.unit) ? 1 : item.qty), 0);
}

/** True when the seller charged something other than the normal price. */
export const hasPriceChange = (item: Pick<OrderItem, 'unitPrice' | 'listPrice'>): boolean =>
  item.listPrice !== undefined && item.listPrice !== item.unitPrice;
