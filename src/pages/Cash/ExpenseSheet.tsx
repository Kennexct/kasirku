import { useState } from 'react';
import toast from 'react-hot-toast';
import { RupiahInput } from '../../components/ui/RupiahInput';
import { Sheet } from '../../components/ui/Sheet';
import { Switch } from '../../components/ui/Switch';
import { btnPrimary, helperText, inputBase, labelBase, option } from '../../components/ui/styles';
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABEL, EXPENSE_NOTE_MAX } from '../../constants';
import { formatBusinessDate } from '../../lib/dateRange';
import { addExpense } from '../../services/expenses';
import type { BusinessDate, ExpenseCategory, Id } from '../../types';

interface ExpenseSheetProps {
  storeId: Id;
  actorId: Id;
  businessDate: BusinessDate;
  onClose: () => void;
}

/** "Catat pengeluaran": amount first (the only required field), then category, note, and whether it came from the drawer. */
export function ExpenseSheet({ storeId, actorId, businessDate, onClose }: ExpenseSheetProps) {
  const [amount, setAmount] = useState<number | null>(null);
  const [category, setCategory] = useState<ExpenseCategory>('ingredients');
  const [note, setNote] = useState('');
  const [isFromDrawer, setIsFromDrawer] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const submit = async () => {
    setIsSaving(true);
    try {
      await addExpense(storeId, { businessDate, category, amount, note, isFromDrawer, actorId });
      toast.success('Pengeluaran dicatat');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mencatat pengeluaran.');
      setIsSaving(false);
    }
  };

  return (
    <Sheet
      title="Catat pengeluaran"
      subtitle={formatBusinessDate(businessDate)}
      isOpen
      onClose={onClose}
      footer={
        <button type="button" disabled={isSaving || !amount} onClick={() => void submit()} className={`${btnPrimary} w-full`}>
          Simpan pengeluaran
        </button>
      }
    >
      <div className="flex flex-col gap-5">
        <div>
          <label htmlFor="expense-amount" className={labelBase}>Jumlah</label>
          <RupiahInput id="expense-amount" value={amount} onChange={setAmount} autoFocus size="lg" />
        </div>
        <div>
          <p className={labelBase}>Kategori</p>
          <div role="radiogroup" aria-label="Kategori pengeluaran" className="grid grid-cols-2 gap-2">
            {EXPENSE_CATEGORIES.map((value) => (
              <button key={value} type="button" role="radio" aria-checked={category === value} onClick={() => setCategory(value)} className={`${option(category === value)} h-11 justify-start! px-3 text-left text-[14px]`}>
                {EXPENSE_CATEGORY_LABEL[value]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="expense-note" className={labelBase}>Catatan <span className="font-normal text-muted">(opsional)</span></label>
          <input id="expense-note" value={note} maxLength={EXPENSE_NOTE_MAX} placeholder="mis. es batu 2 kantong" onChange={(e) => setNote(e.target.value)} className={inputBase} />
        </div>
        <div>
          <Switch
            checked={isFromDrawer}
            onChange={setIsFromDrawer}
            label="Dibayar dari uang laci"
            description={isFromDrawer ? 'Mengurangi uang laci saat tutup kasir.' : 'Dibayar dari uang lain (transfer, dompet pribadi).'}
          />
          <p className={helperText}>Salah catat? Hapus lalu catat ulang.</p>
        </div>
      </div>
    </Sheet>
  );
}
