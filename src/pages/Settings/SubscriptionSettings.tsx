import { CheckCircle2, Clock, LogOut } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { btnPrimary, btnSecondary, badgeBrand, badgeNeutral, badgeWarn } from '../../components/ui/styles';
import { daysLeft } from '../../lib/accessPass';
import { formatRupiah } from '../../lib/money';
import { ApiError, billingOverview, paymentStatus, startCheckout, type BillingOverview, type PaymentView } from '../../services/account';
import { useAccessStore } from '../../store/useAccessStore';
import { DATE_LOCALE, t } from '../../i18n';
import { SettingsSection } from './SettingsSection';

const fmtDate = (ms: number) => new Date(ms).toLocaleDateString(DATE_LOCALE, { day: 'numeric', month: 'long', year: 'numeric' });
const STATUS: Record<PaymentView['status'], { label: string; cls: string }> = {
  paid: { label: t('Lunas'), cls: badgeBrand },
  pending: { label: t('Menunggu'), cls: badgeWarn },
  failed: { label: t('Gagal'), cls: badgeNeutral },
  expired: { label: t('Kedaluwarsa'), cls: badgeNeutral },
};

/** Settings → Langganan (ADR-013): status, pay with Midtrans, payment history, sign out. */
export function SubscriptionSettings() {
  const access = useAccessStore((s) => s.access);
  const claims = useAccessStore((s) => s.claims);
  const refresh = useAccessStore((s) => s.refresh);
  const signOut = useAccessStore((s) => s.signOut);
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<BillingOverview | null>(null);
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await billingOverview());
      setOffline(false);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'offline') setOffline(true);
    }
  }, []);

  // Back from Midtrans: ?bayar=<orderId>
  useEffect(() => {
    const orderId = params.get('bayar');
    if (!orderId) {
      void load();
      return;
    }
    (async () => {
      try {
        const p = await paymentStatus(orderId);
        if (p.status === 'paid') toast.success(t('Pembayaran diterima. Terima kasih!'));
        else if (p.status === 'pending') toast(t('Pembayaran belum diterima. Status akan diperbarui otomatis.'));
      } catch {
        /* shown via load() */
      }
      await refresh();
      await load();
      params.delete('bayar');
      setParams(params, { replace: true });
    })();
  }, [params, setParams, load, refresh]);

  const pay = async (plan: 'monthly' | 'yearly') => {
    setBusy(plan);
    try {
      const { redirectUrl } = await startCheckout(plan);
      window.location.assign(redirectUrl);
    } catch (e) {
      toast.error(e instanceof ApiError && e.code === 'offline' ? t('Butuh internet untuk membayar.') : t('Gagal membuka pembayaran. Coba lagi.'));
      setBusy(null);
    }
  };

  const status = !access
    ? ''
    : access.kind === 'active'
      ? access.plan === 'trial'
        ? t('Coba gratis, sisa {0} hari (sampai {1}).', daysLeft(access.msLeft), fmtDate(access.until))
        : t('Aktif sampai {0}.', fmtDate(access.until))
      : access.kind === 'grace'
        ? t('Berakhir {0}. Masa tenggang offline sampai {1}.', fmtDate(access.until), fmtDate(access.graceEnds))
        : t('Berakhir {0}. Penjualan baru dinonaktifkan.', fmtDate(access.until));

  const prices = data?.prices ?? { monthly: { amount: 49_000, days: 30 }, yearly: { amount: 490_000, days: 365 } };

  return (
    <>
      <SettingsSection title={t('Status langganan')} description={claims?.email}>
        <p className="flex items-center gap-2 text-[15px] font-semibold">
          {access?.kind === 'active' ? <CheckCircle2 aria-hidden size={18} className="text-brand-600" /> : <Clock aria-hidden size={18} className="text-warn-700" />}
          {status}
        </p>
        <p className="mt-2 text-[13px] text-muted">{t('Perpanjangan ditambahkan setelah tanggal berakhir saat ini, jadi tidak ada hari yang hilang.')}</p>
      </SettingsSection>

      <SettingsSection title={t('Perpanjang')} description={t('Bayar dengan QRIS, virtual account, GoPay, atau ShopeePay lewat Midtrans.')}>
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" className={`${btnPrimary} h-auto flex-col py-3`} onClick={() => void pay('monthly')} disabled={busy !== null}>
            <span>{t('Bulanan')}</span>
            <span className="text-[13px] font-medium opacity-90">{t('{0} / 30 hari', formatRupiah(prices.monthly.amount))}</span>
          </button>
          <button type="button" className={`${btnSecondary} h-auto flex-col py-3`} onClick={() => void pay('yearly')} disabled={busy !== null}>
            <span>{t('Tahunan')}</span>
            <span className="text-[13px] font-medium text-muted">{t('{0} / 365 hari', formatRupiah(prices.yearly.amount))}</span>
          </button>
        </div>
        {offline && <p className="mt-3 text-[13px] text-warn-700">{t('Tidak ada internet. Pembayaran dan riwayat butuh koneksi.')}</p>}
      </SettingsSection>

      {data && data.payments.length > 0 && (
        <SettingsSection title={t('Riwayat pembayaran')}>
          <ul className="divide-y divide-line">
            {data.payments.map((p) => (
              <li key={p.orderId} className="flex items-center justify-between gap-3 py-2.5 text-[14px]">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {p.plan === 'monthly' ? t('Bulanan') : t('Tahunan')} · {formatRupiah(p.amount)}
                  </p>
                  <p className="truncate text-[12px] text-muted">
                    {fmtDate(p.paidAt ?? p.createdAt)} · {p.orderId}
                  </p>
                </div>
                <span className={STATUS[p.status].cls}>{STATUS[p.status].label}</span>
              </li>
            ))}
          </ul>
        </SettingsSection>
      )}

      <SettingsSection title={t('Akun')} description={t('Keluar tidak menghapus data toko di perangkat ini.')}>
        <button type="button" className={btnSecondary} onClick={() => void signOut()}>
          <LogOut aria-hidden size={18} />
          {t('Keluar dari akun')}
        </button>
      </SettingsSection>
    </>
  );
}
