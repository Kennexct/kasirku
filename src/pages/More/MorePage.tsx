import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '../../components/Brand/Logo';
import { navItemsForRole } from '../../components/Layout/navItems';
import { PageHeader } from '../../components/Layout/PageHeader';
import { SyncBadge } from '../../components/Layout/SyncBadge';
import { card } from '../../components/ui/styles';
import { useSessionStore } from '../../store/useSessionStore';

/** Phone-only overflow menu for nav items not in the bottom bar. */
export function MorePage() {
  const cashier = useSessionStore((s) => s.cashier);
  const items = navItemsForRole(cashier?.role).filter((item) => !item.isPrimary);

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <PageHeader title="Lainnya" />
      <div className="flex flex-col gap-4 p-4">
        <div className={`${card} flex items-center gap-3 p-4`}>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-[13px] font-bold text-white">
            {(cashier?.displayName ?? '?').slice(0, 2).toUpperCase()}
          </span>
          <div className="flex-1">
            <p className="text-[15px] font-semibold">{cashier?.displayName}</p>
            <p className="text-[13px] text-muted">{cashier?.role === 'owner' ? 'Pemilik' : 'Kasir'}</p>
          </div>
          <SyncBadge variant="inline" />
        </div>

        <ul className={`${card} divide-y divide-line`}>
          {items.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <Link to={to} className="flex min-h-14 items-center gap-3 px-4 text-[15px] font-medium hover:bg-subtle">
                <Icon aria-hidden size={20} className="text-muted" />
                <span className="flex-1">{label}</span>
                <ChevronRight aria-hidden size={18} className="text-faint" />
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex justify-center opacity-70">
          <Logo size={24} />
        </div>
      </div>
    </section>
  );
}
