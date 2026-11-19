import { useState } from 'react';
import toast from 'react-hot-toast';
import { RupiahInput } from '../../components/ui/RupiahInput';
import { Sheet } from '../../components/ui/Sheet';
import { Switch } from '../../components/ui/Switch';
import { btnPrimary, inputBase, labelBase } from '../../components/ui/styles';
import { CLOSING_NOTE_MAX } from '../../constants';
import { describeDifference, type Drawer } from '../../lib/cashDrawer';
import { formatBusinessDate } from '../../lib/dateRange';
import { formatRupiah } from '../../lib/money';
import { closeDay } from '../../services/dayClosing';
import type { BusinessDate, Id } from '../../types';

interface CloseDaySheetProps {
  storeId: Id;
  actorId: Id;
  businessDate: BusinessDate;
  drawer: Drawer;
  soldOutCount: number;
  onClose: () => void;
}

/** "Tutup kasir": type the counted cash, see the difference before confirming (ADR-007). */
export function CloseDaySheet({ storeId, actorId, businessDate, drawer, soldOutCount, onClose }: CloseDaySheetProps) {
  const [counted, setCounted] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [shouldResetSoldOut, setShouldResetSoldOut] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const difference = counted === null ? null : counted - drawer.expectedCash;

  const submit = async () => {
    setIsSaving(true);
    try {
      const closing = await closeDay({ storeId, businessDate, countedCash: counted, note, actorId, shouldResetSoldOut: soldOutCount > 0 && shouldResetSoldOut });
      toast.success(closing.difference === 0 ? 'Kasir ditutup, uang laci pas' : `Kasir ditutup, selisih ${describeDifference(closing.difference)}`);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menutup kasir.');
      setIsSaving(false);
    }
  };

  return (
    <Sheet
      title="Tutup kasir"
      subtitle={formatBusinessDate(businessDate)}
      isOpen
      onClose={onClose}
      footer={
        <button type="button" disabled={isSaving || counted === null} onClick={() => void submit()} className={`${btnPrimary} w-full`}>
          Tutup kasir
        </button>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-baseline justify-between gap-3 rounded-lg bg-subtle px-3.5 py-3">
          <span className="text-[14px] text-ink-soft">Uang di laci seharusnya</span>
          <span className="num text-[18px] font-bold">{formatRupiah(drawer.expectedCash)}</span>
        </div>
        <div>
          <label htmlFor="counted-cash" className={labelBase}>Uang yang dihitung di laci</label>
          <RupiahInput id="counted-cash" value={counted} onChange={setCounted} autoFocus size="lg" />
          <p aria-live="polite" className={`num mt-2 text-[14px] font-semibold ${difference === null ? 'text-muted' : difference === 0 ? 'text-brand-700' : difference < 0 ? 'text-danger-700' : 'text-warn-700'}`}>
            {difference === null ? 'Hitung uang tunai di laci, lalu ketik jumlahnya.' : difference === 0 ? 'Pas, tidak ada selisih.' : `Selisih: ${describeDifference(difference)}`}
          </p>
        </div>
        <div>
          <label htmlFor="closing-note" className={labelBase}>Catatan <span className="font-normal text-muted">(opsional)</span></label>
          <input id="closing-note" value={note} maxLength={CLOSING_NOTE_MAX} placeholder="mis. kembalian kurang Rp2.000" onChange={(e) => setNote(e.target.value)} className={inputBase} />
        </div>
        {soldOutCount > 0 && (
          <Switch
            checked={shouldResetSoldOut}
            onChange={setShouldResetSoldOut}
            label={`Sediakan lagi ${soldOutCount} menu yang habis`}
            description="Tanda Habis dilepas supaya besok bisa langsung jualan."
          />
        )}
        {drawer.openOrderCount > 0 && (
          <p className="rounded-lg border border-warn-200 bg-warn-50 px-3.5 py-2.5 text-[13px] text-warn-700">
            {drawer.openOrderCount} pesanan belum dibayar ({formatRupiah(drawer.openOrderAmount)}). Pesanan itu tetap tersimpan dan dihitung saat dibayar.
          </p>
        )}
      </div>
    </Sheet>
  );
}
