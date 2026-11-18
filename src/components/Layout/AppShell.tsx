import { MoreHorizontal } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { useOpenOrderCount } from '../../hooks/useOpenOrderCount';
import { useSessionStore } from '../../store/useSessionStore';
import { LogoMark } from '../Brand/Logo';
import { navItemsForRole, type NavItem } from './navItems';
import { SyncBadge } from './SyncBadge';

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      aria-label={`${count} pesanan belum dibayar`}
      className="num absolute right-2 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger-600 px-1 text-[11px] font-bold text-white ring-2 ring-surface"
    >
      {count}
    </span>
  );
}

/** Tablet rail item: icon over label, 3px indicator bar on the active item. */
function RailLink({ item, badge }: { item: NavItem; badge: number }) {
  const { to, label, icon: Icon } = item;
  return (
    <NavLink
      to={to}
      end={to === ROUTES.pos}
      className={({ isActive }) =>
        `group relative flex h-[60px] flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-semibold transition-colors ${
          isActive ? 'bg-brand-50 text-brand-700' : 'text-muted hover:bg-subtle hover:text-ink'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span aria-hidden className={`absolute -left-3 top-3 bottom-3 w-[3px] rounded-r-full ${isActive ? 'bg-brand-600' : 'bg-transparent'}`} />
          <Icon aria-hidden size={22} />
          {label}
          <CountBadge count={badge} />
        </>
      )}
    </NavLink>
  );
}

/** Phone tab item: no pill background — color + weight carry the active state. */
function TabLink({ to, label, icon: Icon, badge }: { to: string; label: string; icon: NavItem['icon']; badge: number }) {
  return (
    <NavLink
      to={to}
      end={to === ROUTES.pos}
      className={({ isActive }) =>
        `relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${isActive ? 'text-brand-700' : 'text-muted'}`
      }
    >
      <Icon aria-hidden size={22} />
      {label}
      <CountBadge count={badge} />
    </NavLink>
  );
}

/**
 * Phone (< md): content + bottom tab bar (primary items + "Lainnya").
 * Tablet/desktop (>= md): 84px side rail with logomark, nav, sync status and cashier.
 */
export function AppShell() {
  const cashier = useSessionStore((s) => s.cashier);
  const openOrders = useOpenOrderCount();
  const items = navItemsForRole(cashier?.role);
  const badgeFor = (item: NavItem) => (item.to === ROUTES.openOrders ? openOrders : 0);
  const initials = (cashier?.displayName ?? '?').slice(0, 2).toUpperCase();

  return (
    <div className="flex h-dvh bg-canvas text-ink">
      <nav aria-label="Navigasi utama" className="hidden w-[84px] shrink-0 flex-col border-r border-line bg-surface px-3 py-3 md:flex">
        <div className="mb-4 flex justify-center">
          <LogoMark size={36} />
        </div>
        <div className="flex flex-col gap-1">
          {items.map((item) => (
            <RailLink key={item.to} item={item} badge={badgeFor(item)} />
          ))}
        </div>
        <div className="mt-auto flex flex-col items-center gap-4 border-t border-line pt-4">
          <SyncBadge />
          <span
            title={`${cashier?.displayName ?? ''} · ${cashier?.role === 'owner' ? 'Pemilik' : 'Kasir'}`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-[12px] font-bold text-white"
          >
            {initials}
          </span>
        </div>
      </nav>

      <main className="flex min-w-0 flex-1 flex-col pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0">
        <Outlet />
      </main>

      <nav
        aria-label="Navigasi bawah"
        className="fixed inset-x-0 bottom-0 z-30 grid h-[calc(64px+env(safe-area-inset-bottom))] auto-cols-fr grid-flow-col border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {items
          .filter((item) => item.isPrimary)
          .map((item) => (
            <TabLink key={item.to} to={item.to} label={item.label} icon={item.icon} badge={badgeFor(item)} />
          ))}
        <TabLink to={ROUTES.more} label="Lainnya" icon={MoreHorizontal} badge={0} />
      </nav>
    </div>
  );
}
