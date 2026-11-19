import { t } from '../i18n';
import type { Product, ProductVariant, Rupiah, SalesMode } from '../types';
import { resolveModePrice } from './pricing';

/** Product variants (ADR-012): Kopi → Latte, Americano… each sold as its own item at its own full price. */
export const MAX_VARIANTS = 20;
export const VARIANT_NAME_MAX = 40;

export const activeVariants = (product: Product): ProductVariant[] =>
  [...(product.variants ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

export const hasVariants = (product: Product): boolean => (product.variants?.length ?? 0) > 0;

/** The product as seen by the price rules when a variant is chosen: its price and mode prices replace the product's. */
export function priceTarget(product: Product, variant: ProductVariant | undefined): Product {
  if (!variant) return product;
  return { ...product, basePrice: variant.price, modePrices: variant.modePrices ?? {}, costPrice: variant.costPrice ?? product.costPrice };
}

export const variantPrice = (product: Product, variant: ProductVariant | undefined, mode: SalesMode): Rupiah =>
  resolveModePrice(priceTarget(product, variant), mode);

/** Cheapest variant for this mode — what a tile shows as "mulai". */
export function fromPrice(product: Product, mode: SalesMode): Rupiah {
  const variants = activeVariants(product);
  if (variants.length === 0) return resolveModePrice(product, mode);
  return Math.min(...variants.map((v) => variantPrice(product, v, mode)));
}

/** Unsellable when marked sold out itself, or when every variant is. */
export const isProductSoldOut = (product: Product): boolean =>
  product.isSoldOut === true || (hasVariants(product) && activeVariants(product).every((v) => v.isSoldOut === true));

/** "Kopi – Latte"; the plain name when there is no variant. */
export const lineName = (product: Pick<Product, 'name'>, variant: Pick<ProductVariant, 'name'> | undefined): string =>
  variant ? `${product.name} – ${variant.name}` : product.name;

/** Returns the first problem with a product's variants, or null. Empty list = no variants, which is fine. */
export function validateVariants(variants: readonly ProductVariant[]): string | null {
  if (variants.length > MAX_VARIANTS) return t('Maksimal {0} varian per produk.', MAX_VARIANTS);
  const seen = new Set<string>();
  for (const variant of variants) {
    const name = variant.name.trim();
    if (name === '') return t('Nama varian wajib diisi.');
    if (name.length > VARIANT_NAME_MAX) return t('Nama varian maksimal {0} karakter.', VARIANT_NAME_MAX);
    if (seen.has(name.toLowerCase())) return t('Varian "{0}" ada dua kali.', name);
    seen.add(name.toLowerCase());
    const prices = [variant.price, variant.costPrice, ...Object.values(variant.modePrices ?? {})].filter((p) => p !== undefined);
    if (prices.some((p) => !Number.isSafeInteger(p) || (p as number) < 0)) return t('Harga varian "{0}" tidak valid.', name);
  }
  return null;
}
