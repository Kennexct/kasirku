import { BarChart3, CircleHelp, ClipboardList, Package, ReceiptText, Settings, Store, Users, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ROUTES } from '../../constants';
import { t } from '../../i18n';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Route is wrapped in <OwnerGate>; nav shows a lock while owner mode is locked. */
  isOwnerOnly?: boolean;
  /** Shown in the phone bottom bar; the rest go under "Lainnya". */
  isPrimary?: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { to: ROUTES.pos, label: t('Kasir'), icon: Store, isPrimary: true },
  { to: ROUTES.openOrders, label: t('Pesanan'), icon: ClipboardList, isPrimary: true },
  { to: ROUTES.history, label: t('Riwayat'), icon: ReceiptText, isPrimary: true },
  { to: ROUTES.cash, label: t('Kas'), icon: Wallet },
  { to: ROUTES.reports, label: t('Laporan'), icon: BarChart3, isOwnerOnly: true, isPrimary: true },
  { to: ROUTES.products, label: t('Produk'), icon: Package, isOwnerOnly: true },
  { to: ROUTES.customers, label: t('Pelanggan'), icon: Users },
  { to: ROUTES.settings, label: t('Pengaturan'), icon: Settings, isOwnerOnly: true },
  { to: ROUTES.help, label: t('Bantuan'), icon: CircleHelp },
];
