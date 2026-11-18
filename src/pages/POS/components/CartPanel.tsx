import { Minus, Percent, Plus, ShoppingBasket, StickyNote, Trash2, UserRound } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '../../../components/ui/EmptyState';
import { btnGhost, btnIcon, btnPrimary, btnSecondary, inputBase } from '../../../components/ui/styles';
import { formatRupiah } from '../../../lib/money';
import { lineTotal } from '../../../lib/pricing';
import { useCartStore } from '../../../store/useCartStore';
import type { OrderTotals } from '../../../types';

interface CartPanelProps {
  totals: OrderTotals;
  modeName: string;
  /** False when a parent (the phone sheet) already shows the title. */
  hasTitle?: boolean;
  customerName: string | null;
  onOpenCustomer: () => void;
  onOpenDiscount: () => void;
  onSave: () => void;
  onPay: () => void;
}

export function CartPanel({ totals, modeName, hasTitle = true, customerName, onOpenCustomer, onOpenDiscount, onSave, onPay }: CartPanelProps) {
  const items = useCartStore((s) => s.items);
  const label = useCartStore((s) => s.label);
  const openOrderId = useCartStore((s) => s.openOrderId);
  const orderDiscount = useCartStore((s) => s.orderDiscount);
  const setQty = useCartStore((s) => s.setQty);
  const setItemNote = useCartStore((s) => s.setItemNote);
  const clear = useCartStore((s) => s.clear);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const isEmpty = items.length === 0;
  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);
  const discountTotal = totals.itemDiscountTotal + totals.orderDiscountTotal;

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="flex items-center gap-2 px-5 py-3">
        <div className="min-w-0 flex-1">
          {hasTitle && <h2 className="truncate text-[17px] font-bold tracking-[-0.01em]">{openOrderId ? label : 'Pesanan baru'}</h2>}
          <p className="num text-[13px] text-muted">
            {!hasTitle && openOrderId ? `${label} · ` : ''}
            {modeName} · {itemCount} item
          </p>
        </div>
        {!isEmpty && (
          <button type="button" onClick={clear} className={`${btnGhost} text-[14px] text-danger-700! hover:bg-danger-50!`}>
            <Trash2 aria-hidden size={16} /> Kosongkan
          </button>
        )}
      </div>

      <div className="px-5 pb-3">
        <button
          type="button"
          onClick={onOpenCustomer}
          className={`flex h-11 w-full items-center gap-2 rounded-lg border px-3 text-left text-[14px] transition-colors hover:bg-subtle ${
            customerName ? 'border-line-strong font-semibold text-ink' : 'border-dashed border-line-strong font-medium text-muted'
          }`}
        >
          <UserRound aria-hidden size={16} className="shrink-0" />
          <span className="min-w-0 flex-1 truncate">{customerName ?? 'Tambah pelanggan'}</span>
          {customerName && <span className="text-[13px] font-medium text-brand-700">Ganti</span>}
        </button>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto border-y border-line">
        {isEmpty && (
          <li>
            <EmptyState icon={ShoppingBasket} title="Belum ada item" description="Ketuk produk di sebelah kiri untuk mulai mencatat penjualan." />
          </li>
        )}
        {items.map((item) => (
          <li key={item.id} className="border-b border-line px-5 py-3 last:border-b-0">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold leading-snug">{item.nameSnapshot}</p>
                {item.options.length > 0 && <p className="text-[13px] text-muted">{item.options.map((o) => o.name).join(' · ')}</p>}
              </div>
              <p className="num text-[15px] font-semibold">{formatRupiah(lineTotal(item))}</p>
            </div>

            {editingNoteId === item.id ? (
              <input
                autoFocus
                aria-label="Catatan item"
                defaultValue={item.note}
                placeholder="Contoh: kuah pisah, tanpa bawang"
                onBlur={(event) => {
                  setItemNote(item.id, event.target.value.trim());
                  setEditingNoteId(null);
                }}
                onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
                className={`${inputBase} mt-2 h-11 text-[14px]`}
              />
            ) : (
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingNoteId(item.id)}
                  className={`flex h-11 min-w-0 flex-1 items-center gap-1.5 rounded-md text-left text-[13px] ${item.note ? 'text-ink-soft' : 'text-muted'} hover:text-ink`}
                >
                  <StickyNote aria-hidden size={15} className="shrink-0" />
                  <span className="truncate">{item.note || 'Tambah catatan'}</span>
                </button>
                <div className="flex items-center rounded-lg">
                  <button type="button" aria-label={`Kurangi ${item.nameSnapshot}`} onClick={() => setQty(item.id, item.qty - 1)} className={btnIcon}>
                    {item.qty === 1 ? <Trash2 aria-hidden size={17} className="text-danger-600" /> : <Minus aria-hidden size={17} />}
                  </button>
                  <span className="num w-9 text-center text-[15px] font-bold">{item.qty}</span>
                  <button type="button" aria-label={`Tambah ${item.nameSnapshot}`} onClick={() => setQty(item.id, item.qty + 1)} className={btnIcon}>
                    <Plus aria-hidden size={17} />
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      <dl className="flex flex-col gap-1 px-5 pt-3 text-[14px]">
        <SummaryRow label="Subtotal" value={formatRupiah(totals.subtotal)} />
        <div className="flex h-9 items-center justify-between">
          <dt>
            <button type="button" onClick={onOpenDiscount} disabled={isEmpty} className="-ml-1 inline-flex h-9 items-center gap-1.5 rounded-md px-1 font-semibold text-brand-700 hover:bg-brand-50 disabled:text-faint">
              <Percent aria-hidden size={15} />
              {orderDiscount ? orderDiscount.name : 'Tambah diskon'}
            </button>
          </dt>
          {discountTotal > 0 && <dd className="num font-medium text-brand-700">−{formatRupiah(discountTotal)}</dd>}
        </div>
        {totals.serviceTotal > 0 && <SummaryRow label="Service" value={formatRupiah(totals.serviceTotal)} />}
        {totals.taxTotal > 0 && <SummaryRow label="Pajak" value={formatRupiah(totals.taxTotal)} />}
        <div className="mt-1 flex items-baseline justify-between border-t border-dashed border-line-strong pt-2.5">
          <dt className="text-[15px] font-semibold">Total</dt>
          <dd className="num text-[20px] font-bold tracking-[-0.02em]">{formatRupiah(totals.grandTotal)}</dd>
        </div>
      </dl>

      <div className="flex gap-2 px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <button type="button" disabled={isEmpty} onClick={onSave} className={btnSecondary}>
          Simpan
        </button>
        <button type="button" disabled={isEmpty} onClick={onPay} className={`${btnPrimary} h-12 flex-1 justify-between!`}>
          <span>Bayar</span>
          <span className="num text-[16px]">{formatRupiah(totals.grandTotal)}</span>
        </button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex h-7 items-center justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className="num font-medium text-ink-soft">{value}</dd>
    </div>
  );
}
