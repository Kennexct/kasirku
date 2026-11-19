import { Plus, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader } from '../../components/Layout/PageHeader';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { RupiahInput } from '../../components/ui/RupiahInput';
import { Sheet } from '../../components/ui/Sheet';
import { btnDangerSolid, btnPrimary, btnSecondary, helperText, labelBase } from '../../components/ui/styles';
import { Tabs } from '../../components/ui/Tabs';
import { EXPENSE_CATEGORY_LABEL } from '../../constants';
import { useAppData } from '../../hooks/useAppData';
import { useClosings, useDrawerDay, useExpenses, useIsUnclosed, useMemberNames } from '../../hooks/useCash';
import { useDateRange } from '../../hooks/useDateRange';
import { getBusinessDate } from '../../lib/businessDate';
import { buildDrawer } from '../../lib/cashDrawer';
import { addDays, formatBusinessDate } from '../../lib/dateRange';
import { formatRupiah } from '../../lib/money';
import { approverOf } from '../../lib/permissions';
import { reopenDay, setOpeningCash } from '../../services/dayClosing';
import { deleteExpense } from '../../services/expenses';
import { requestOwnerApproval } from '../../store/usePinPromptStore';
import type { Expense, Id } from '../../types';
import { CloseDaySheet } from './CloseDaySheet';
import { ClosingHistory } from './ClosingHistory';
import { ExpenseSheet } from './ExpenseSheet';
import { ExpensesPanel } from './ExpensesPanel';
import { TodayPanel } from './TodayPanel';

type View = 'day' | 'expenses' | 'closings';
type Dialog = { kind: 'expense' | 'close' | 'opening' | 'reopen' } | { kind: 'deleteExpense'; expense: Expense } | null;

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Terjadi kesalahan.');

/** "Kas": the day's cash drawer, expenses, and close of day (ADR-007). Open to every seller. */
export function CashPage() {
  const { store, catalog, cashierId, access } = useAppData();
  const storeId = store?.id ?? null;
  const today = store ? getBusinessDate(new Date(), store) : new Date().toISOString().slice(0, 10);
  const yesterday = addDays(today, -1);

  const [view, setView] = useState<View>('day');
  const [date, setDate] = useState(today);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [openingDraft, setOpeningDraft] = useState<number | null>(null);

  const day = useDrawerDay(storeId, date);
  const isYesterdayUnclosed = useIsUnclosed(storeId, yesterday);
  const expenseRange = useDateRange(today);
  const expenses = useExpenses(storeId, expenseRange.range);
  const closings = useClosings(storeId);
  const memberNames = useMemberNames(storeId);

  if (!store || !catalog || !day) return <LoadingScreen />;
  const drawer = buildDrawer(day.input);
  const soldOutCount = catalog.products.filter((p) => p.isActive && p.isSoldOut).length;
  const isToday = date === today;

  /** Owner-only actions: returns the approving owner, `null` when no PIN is set, or `undefined` when refused. */
  const ownerApproval = async (reason: string): Promise<Id | null | undefined> => {
    if (access.kind !== 'locked') return approverOf(access);
    return (await requestOwnerApproval(reason))?.ownerId;
  };

  const saveOpening = async () => {
    try {
      await setOpeningCash(store.id, date, openingDraft ?? 0);
      setDialog(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const confirmReopen = async () => {
    if (!day.closing) return;
    const approver = await ownerApproval(`Buka kembali kasir ${formatBusinessDate(date)}`);
    if (approver === undefined) return;
    try {
      await reopenDay(day.closing.id, cashierId, approver);
      toast.success('Kasir dibuka kembali');
      setDialog(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const confirmDeleteExpense = async (expense: Expense) => {
    const approver = await ownerApproval(`Hapus pengeluaran ${formatRupiah(expense.amount)}`);
    if (approver === undefined) return;
    try {
      await deleteExpense(expense.id, cashierId, approver);
      toast.success('Pengeluaran dihapus');
      setDialog(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title="Kas"
        description={view === 'day' ? formatBusinessDate(date) : 'Pengeluaran dan tutup kasir'}
        actions={
          <button type="button" aria-label="Catat pengeluaran" onClick={() => setDialog({ kind: 'expense' })} className={`${btnPrimary} h-11`}>
            <Plus aria-hidden size={18} /> <span className="hidden sm:inline">Catat pengeluaran</span>
          </button>
        }
      >
        <Tabs
          label="Bagian kas"
          value={view}
          onChange={setView}
          items={[
            { value: 'day', label: isToday ? 'Hari ini' : 'Kemarin' },
            { value: 'expenses', label: 'Pengeluaran' },
            { value: 'closings', label: 'Riwayat tutup' },
          ]}
        />
      </PageHeader>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 md:px-8 md:py-6">
        {view === 'day' && (
          <div className="flex flex-col gap-4">
            {isToday && isYesterdayUnclosed && (
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-warn-200 bg-warn-50 px-4 py-3 text-[14px] text-warn-700">
                <TriangleAlert aria-hidden size={18} className="shrink-0" />
                <span className="min-w-0 flex-1">Kasir kemarin ({formatBusinessDate(yesterday)}) belum ditutup.</span>
                <button type="button" onClick={() => setDate(yesterday)} className={`${btnSecondary} h-10 text-[14px]`}>Tutup kemarin</button>
              </div>
            )}
            {!isToday && (
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-subtle px-4 py-3 text-[14px] text-ink-soft">
                <span className="min-w-0 flex-1">Menampilkan kasir kemarin, {formatBusinessDate(date)}.</span>
                <button type="button" onClick={() => setDate(today)} className={`${btnSecondary} h-10 text-[14px]`}>Kembali ke hari ini</button>
              </div>
            )}
            <TodayPanel
              storeName={store.name}
              timeZone={store.timezone}
              drawer={drawer}
              closing={day.closing}
              closedByName={day.closing ? (memberNames.get(day.closing.closedById) ?? 'Kasir') : ''}
              onEditOpening={() => {
                setOpeningDraft(drawer.openingCash || null);
                setDialog({ kind: 'opening' });
              }}
              onClose={() => setDialog({ kind: 'close' })}
              onReopen={() => setDialog({ kind: 'reopen' })}
              onShowExpenses={() => setView('expenses')}
            />
          </div>
        )}
        {view === 'expenses' && (
          <ExpensesPanel
            dateRange={expenseRange}
            today={today}
            expenses={expenses ?? []}
            memberNames={memberNames}
            onAdd={() => setDialog({ kind: 'expense' })}
            onDelete={(expense) => setDialog({ kind: 'deleteExpense', expense })}
          />
        )}
        {view === 'closings' && <ClosingHistory closings={closings ?? []} memberNames={memberNames} />}
      </div>

      {dialog?.kind === 'expense' && <ExpenseSheet storeId={store.id} actorId={cashierId} businessDate={view === 'day' ? date : today} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'close' && (
        <CloseDaySheet storeId={store.id} actorId={cashierId} businessDate={date} drawer={drawer} soldOutCount={isToday ? soldOutCount : 0} onClose={() => setDialog(null)} />
      )}
      {dialog?.kind === 'opening' && (
        <Sheet
          title="Modal awal"
          subtitle={formatBusinessDate(date)}
          isOpen
          onClose={() => setDialog(null)}
          footer={<button type="button" onClick={() => void saveOpening()} className={`${btnPrimary} w-full`}>Simpan modal awal</button>}
        >
          <label htmlFor="opening-cash" className={labelBase}>Uang di laci saat mulai jualan</label>
          <RupiahInput id="opening-cash" value={openingDraft} onChange={setOpeningDraft} autoFocus size="lg" />
          <p className={helperText}>Uang kembalian yang sudah ada di laci sebelum penjualan pertama.</p>
        </Sheet>
      )}
      {dialog?.kind === 'reopen' && (
        <Sheet
          title="Buka kembali kasir?"
          subtitle={formatBusinessDate(date)}
          isOpen
          onClose={() => setDialog(null)}
          footer={
            <div className="flex gap-2">
              <button type="button" onClick={() => setDialog(null)} className={btnSecondary}>Batal</button>
              <button type="button" onClick={() => void confirmReopen()} className={`${btnDangerSolid} flex-1`}>Buka kembali</button>
            </div>
          }
        >
          <p className="text-[14px] text-ink-soft">Hasil tutup kasir hari ini dihapus dan harus dihitung ulang. Tindakan ini tercatat dan butuh izin pemilik.</p>
        </Sheet>
      )}
      {dialog?.kind === 'deleteExpense' && (
        <Sheet
          title="Hapus pengeluaran?"
          subtitle={`${EXPENSE_CATEGORY_LABEL[dialog.expense.category]} · ${formatRupiah(dialog.expense.amount)}`}
          isOpen
          onClose={() => setDialog(null)}
          footer={
            <div className="flex gap-2">
              <button type="button" onClick={() => setDialog(null)} className={btnSecondary}>Batal</button>
              <button type="button" onClick={() => void confirmDeleteExpense(dialog.expense)} className={`${btnDangerSolid} flex-1`}>Hapus pengeluaran</button>
            </div>
          }
        >
          <p className="text-[14px] text-ink-soft">Pengeluaran ini tidak lagi dihitung di kas dan laporan. Tindakan ini tercatat dan butuh izin pemilik.</p>
        </Sheet>
      )}
    </section>
  );
}
