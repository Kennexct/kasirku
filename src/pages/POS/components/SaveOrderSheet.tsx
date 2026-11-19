import { useState } from 'react';
import { Sheet } from '../../../components/ui/Sheet';
import { btnPrimary, helperText, inputBase, labelBase, option } from '../../../components/ui/styles';
import { t } from '../../../i18n';

const QUICK_LABELS = [t('Meja 1'), t('Meja 2'), t('Meja 3'), t('Meja 4'), t('Meja 5'), t('Bungkus')] as const;

interface SaveOrderSheetProps {
  initialLabel: string;
  isSubmitting: boolean;
  onSave: (label: string) => void;
  onClose: () => void;
}

/** M8: name an unpaid order so it can be found later ("Meja 5", "Mas jaket merah"). */
export function SaveOrderSheet({ initialLabel, isSubmitting, onSave, onClose }: SaveOrderSheetProps) {
  const [label, setLabel] = useState(initialLabel);
  const trimmed = label.trim();

  return (
    <Sheet
      title={t('Simpan pesanan')}
      subtitle={t('Bayar nanti — pesanan masuk ke daftar Pesanan')}
      isOpen
      onClose={onClose}
      footer={
        <button type="button" disabled={trimmed.length === 0 || isSubmitting} onClick={() => onSave(trimmed)} className={`${btnPrimary} w-full`}>
          {isSubmitting ? t('Menyimpan…') : t('Simpan pesanan')}
        </button>
      }
    >
      <label htmlFor="order-label" className={labelBase}>{t('Label pesanan')}</label>
      <input
        id="order-label"
        autoFocus
        value={label}
        maxLength={40}
        placeholder={t('Contoh: Meja 5 / Mas jaket merah')}
        onChange={(event) => setLabel(event.target.value)}
        onKeyDown={(event) => event.key === 'Enter' && trimmed && onSave(trimmed)}
        className={inputBase}
      />
      <p className={helperText}>{t('Gunakan nomor meja atau ciri pelanggan agar mudah ditemukan.')}</p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {QUICK_LABELS.map((quick) => (
          <button key={quick} type="button" onClick={() => setLabel(quick)} className={option(label === quick)}>
            {quick}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
