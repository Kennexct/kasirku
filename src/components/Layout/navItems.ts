import { BarChart3, ClipboardList, Package, ReceiptText, Settings, Store, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ROUTES } from '../../constants';

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
  { to: ROUTES.pos, label: 'Kasir', icon: Store, isPrimary: true },
  { to: ROUTES.openOrders, label: 'Pesanan', icon: ClipboardList, isPrimary: true },
  { to: ROUTES.history, label: 'Riwayat', icon: ReceiptText, isPrimary: true },
  { to: ROUTES.reports, label: 'Laporan', icon: BarChart3, isOwnerOnly: true, isPrimary: true },
  { to: ROUTES.products, label: 'Produk', icon: Package, isOwnerOnly: true },
  { to: ROUTES.customers, label: 'Pelanggan', icon: Users },
  { to: ROUTES.settings, label: 'Pengaturan', icon: Settings, isOwnerOnly: true },
];
