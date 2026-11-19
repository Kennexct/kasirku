import { Lock, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { useOwnerAccess } from '../../hooks/useOwnerAccess';
import { useSessionStore } from '../../store/useSessionStore';
import { Sheet } from '../ui/Sheet';
import { btnSecondary, sectionTitle } from '../ui/styles';
import { SellerSwitcher } from './SellerSwitcher';
import { t } from '../../i18n';

/** Who is selling, switch seller, and lock owner mode. */
export function AccountSheet({ onClose }: { onClose: () => void }) {
  const cashier = useSessionStore((s) => s.cashier);
  const hasOwnerPin = useSessionStore((s) => s.hasOwnerPin);
  const lockOwner = useSessionStore((s) => s.lockOwner);
  const access = useOwnerAccess();

  return (
    <Sheet title={t('Akun')} subtitle={cashier ? t('Sedang berjualan: {0}', cashier.displayName) : undefined} isOpen onClose={onClose}>
      {access.kind === 'unlocked' && (
        <div className="mb-5 flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50 p-3">
          <ShieldCheck aria-hidden size={20} className="shrink-0 text-brand-700" />
          <p className="flex-1 text-[13px] text-brand-800">{t('Mode pemilik terbuka. Terkunci otomatis 5 menit setelah tidak dipakai.')}</p>
          <button type="button" onClick={() => { lockOwner(); onClose(); }} className={`${btnSecondary} h-10 text-[14px]`}>
            <Lock aria-hidden size={16} /> {t('Kunci')}
          </button>
        </div>
      )}

      {hasOwnerPin ? (
        <>
          <h3 className={`${sectionTitle} mb-2.5`}>{t('Ganti kasir')}</h3>
          <SellerSwitcher onDone={onClose} />
        </>
      ) : (
        <p className="text-[14px] text-ink-soft">
          {t('Belum ada PIN. Untuk menambah kasir dan mengunci layar pemilik, atur PIN di')}{' '}
          <Link to={`${ROUTES.settings}?tab=staff`} onClick={onClose} className="font-semibold text-brand-700 underline">
            {t('Pengaturan → Staf & PIN')}
          </Link>
          .
        </p>
      )}
    </Sheet>
  );
}
