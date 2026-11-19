import type { PriceRule } from '../../types';
import { t } from '../../i18n';

export const PRICE_RULE_OPTIONS: ReadonlyArray<{ value: PriceRule; label: string }> = [
  { value: 'none', label: t('Harga dasar') },
  { value: 'mode_price', label: t('Per produk') },
  { value: 'markup', label: t('Markup %') },
];

export const PRICE_RULE_HELP: Record<PriceRule, string> = {
  none: t('Semua produk memakai harga dasar.'),
  mode_price: t('Atur harga khusus di setiap produk (mis. biaya cup takeaway). Kosong = harga dasar.'),
  markup: t('Harga dasar dinaikkan otomatis, cocok untuk menutup komisi ojol.'),
};
