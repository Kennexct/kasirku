import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Sheet } from '../../components/ui/Sheet';
import { btnDanger, btnDangerSolid, btnIcon, btnPrimary, btnSecondary, helperText, inputBase, labelBase } from '../../components/ui/styles';
import { CONFIG_NAME_MAX } from '../../constants';
import { deleteConfig, moveConfig, renameConfig } from '../../services/checkoutConfig';
import type { Id } from '../../types';
import { t } from '../../i18n';

interface ConfigItemSheetProps {
  table: 'paymentMethods' | 'salesModes';
  /** "metode" / "mode" — used in labels and toasts. */
  noun: string;
  item: { id: Id; name: string };
  /** Zero-based position among the store's items, and how many there are. */
  index: number;
  count: number;
  /** Set when the item must stay (default mode, last active method); shown instead of the delete button. */
  deleteBlockedReason: string | null;
  onClose: () => void;
}

const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : t('Terjadi kesalahan.'));

/** Rename, reorder and delete one payment method or sales mode (ADR-006). */
export function ConfigItemSheet({ table, noun, item, index, count, deleteBlockedReason, onClose }: ConfigItemSheetProps) {
  const [name, setName] = useState(item.name);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const isRenamed = name.trim() !== item.name;

  const run = async (action: () => Promise<void>, onDone?: () => void) => {
    try {
      await action();
      onDone?.();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const rename = () =>
    run(
      () => renameConfig(table, item.id, name),
      () => {
        toast.success(t('Nama diperbarui'));
        onClose();
      },
    );

  const remove = () =>
    run(
      () => deleteConfig(table, item.id),
      () => {
        toast.success(t('{0} dihapus', item.name));
        onClose();
      },
    );

  if (isConfirmingDelete) {
    return (
      <Sheet
        title={t('Hapus {0}?', item.name)}
        isOpen
        onClose={() => setIsConfirmingDelete(false)}
        footer={
          <div className="flex gap-2">
            <button type="button" onClick={() => setIsConfirmingDelete(false)} className={btnSecondary}>{t('Batal')}</button>
            <button type="button" onClick={() => void remove()} className={`${btnDangerSolid} flex-1`}>{t('Hapus')} {noun}</button>
          </div>
        }
      >
        <p className="text-[14px] text-ink-soft">
          {item.name} {t('tidak lagi muncul di kasir. Penjualan yang sudah tercatat tetap memakai nama ini di riwayat, struk, dan laporan.')}
        </p>
      </Sheet>
    );
  }

  return (
    <Sheet
      title={t('Kelola {0}', noun)}
      subtitle={item.name}
      isOpen
      onClose={onClose}
      footer={
        <button type="button" disabled={!isRenamed} onClick={() => void rename()} className={`${btnPrimary} w-full`}>
          {t('Simpan nama')}
        </button>
      }
    >
      <div className="flex flex-col gap-5">
        <div>
          <label htmlFor="config-name" className={labelBase}>{t('Nama')} {noun}</label>
          <input id="config-name" value={name} maxLength={CONFIG_NAME_MAX} onChange={(e) => setName(e.target.value)} className={inputBase} />
        </div>

        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-medium text-ink">{t('Urutan di kasir')}</p>
            <p className="num text-[13px] text-muted">{t('Posisi')} {index + 1} {t('dari')} {count}</p>
          </div>
          <button type="button" aria-label={t('Naikkan urutan')} disabled={index === 0} onClick={() => void run(() => moveConfig(table, item.id, -1))} className={btnIcon}>
            <ArrowUp aria-hidden size={18} />
          </button>
          <button type="button" aria-label={t('Turunkan urutan')} disabled={index >= count - 1} onClick={() => void run(() => moveConfig(table, item.id, 1))} className={btnIcon}>
            <ArrowDown aria-hidden size={18} />
          </button>
        </div>

        <div className="border-t border-line pt-4">
          {deleteBlockedReason ? (
            <p className={`${helperText} mt-0!`}>{deleteBlockedReason}</p>
          ) : (
            <button type="button" onClick={() => setIsConfirmingDelete(true)} className={`${btnDanger} w-full`}>
              <Trash2 aria-hidden size={18} /> {t('Hapus')} {noun}
            </button>
          )}
        </div>
      </div>
    </Sheet>
  );
}
