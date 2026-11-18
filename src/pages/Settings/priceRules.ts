import type { PriceRule } from '../../types';

export const PRICE_RULE_OPTIONS: ReadonlyArray<{ value: PriceRule; label: string }> = [
  { value: 'none', label: 'Harga dasar' },
  { value: 'mode_price', label: 'Per produk' },
  { value: 'markup', label: 'Markup %' },
];

export const PRICE_RULE_HELP: Record<PriceRule, string> = {
  none: 'Semua produk memakai harga dasar.',
  mode_price: 'Atur harga khusus di setiap produk (mis. biaya cup takeaway). Kosong = harga dasar.',
  markup: 'Harga dasar dinaikkan otomatis, cocok untuk menutup komisi ojol.',
};
