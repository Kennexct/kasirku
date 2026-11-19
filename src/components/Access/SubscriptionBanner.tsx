import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { daysLeft } from '../../lib/accessPass';
import { useAccessStore } from '../../store/useAccessStore';
import { ROUTES } from '../../constants';
import { t } from '../../i18n';

/** Shown from 3 days before the end, during offline grace, and after expiry (ADR-013). */
export function SubscriptionBanner() {
  const access = useAccessStore((s) => s.access);
  if (!access || (access.kind === 'active' && !access.warn)) return null;
  const expired = access.kind === 'expired';
  const text =
    access.kind === 'active'
      ? access.plan === 'trial'
        ? t('Masa coba gratis berakhir dalam {0} hari.', daysLeft(access.msLeft))
        : t('Langganan berakhir dalam {0} hari.', daysLeft(access.msLeft))
      : access.kind === 'grace'
        ? t('Langganan sudah berakhir. Hubungkan ke internet untuk memeriksa pembayaran; kasir tetap jalan sampai {0}.', new Date(access.graceEnds).toLocaleDateString())
        : t('Langganan sudah berakhir. Laporan dan riwayat tetap bisa dibuka; penjualan baru perlu perpanjangan.');
  return (
    <div role={expired ? 'alert' : 'status'} className={`flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-2.5 text-[14px] ${expired ? 'border-danger-200 bg-danger-50 text-danger-700' : 'border-warn-200 bg-warn-50 text-warn-700'}`}>
      <AlertTriangle aria-hidden size={17} className="shrink-0" />
      <span className="min-w-0 flex-1">{text}</span>
      <Link to={`${ROUTES.settings}?tab=subscription`} className="font-semibold underline underline-offset-2">
        {t('Perpanjang')}
      </Link>
    </div>
  );
}
