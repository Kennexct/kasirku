import { MessageCircle, Pencil, Trash2 } from 'lucide-react';
import { Sheet } from '../../components/ui/Sheet';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { btnDanger, btnSecondary, sectionTitle } from '../../components/ui/styles';
import { useCustomerOrders } from '../../hooks/useCustomers';
import { formatPhone, toWhatsAppNumber, type CustomerStats } from '../../lib/customers';
import { formatRupiah } from '../../lib/money';
import type { Customer } from '../../types';

const RECENT_ORDERS = 5;
const dateFormat = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
export const formatVisit = (iso: string | null): string => (iso ? dateFormat.format(new Date(iso)) : '—');
/** Fits a third-width stat tile on a phone ("18 Nov 26"). */
const shortDate = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: '2-digit' });

interface CustomerDetailSheetProps {
  customer: Customer;
  stats: CustomerStats;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-line px-3 py-2.5">
      <dt className="truncate text-[12px] text-muted">{label}</dt>
      <dd className="num truncate text-[16px] font-bold">{value}</dd>
    </div>
  );
}

export function CustomerDetailSheet({ customer, stats, onEdit, onDelete, onClose }: CustomerDetailSheetProps) {
  const orders = useCustomerOrders(customer.id);

  return (
    <Sheet
      title={customer.name}
      subtitle={customer.phone ? formatPhone(customer.phone) : 'Tanpa nomor HP'}
      isOpen
      onClose={onClose}
      footer={
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={onDelete} className={btnDanger}>
            <Trash2 aria-hidden size={18} /> Hapus
          </button>
          <button type="button" onClick={onEdit} className={btnSecondary}>
            <Pencil aria-hidden size={18} /> Ubah
          </button>
        </div>
      }
    >
      <dl className="mb-4 grid grid-cols-3 gap-2">
        <Stat label="Kunjungan" value={String(stats.visits)} />
        <Stat label="Total belanja" value={formatRupiah(stats.totalSpend)} />
        <Stat label="Terakhir" value={stats.lastVisitAt ? shortDate.format(new Date(stats.lastVisitAt)) : '—'} />
      </dl>

      {customer.phone && (
        <a href={`https://wa.me/${toWhatsAppNumber(customer.phone)}`} target="_blank" rel="noopener noreferrer" className={`${btnSecondary} mb-4 w-full`}>
          <MessageCircle aria-hidden size={18} /> Chat WhatsApp
        </a>
      )}
      {customer.note && <p className="mb-4 rounded-lg bg-subtle px-3.5 py-2.5 text-[14px] text-ink-soft">{customer.note}</p>}
      {stats.openOrders > 0 && (
        <p className="mb-4 rounded-lg bg-warn-50 px-3.5 py-2.5 text-[14px] text-warn-700">{stats.openOrders} pesanan belum dibayar.</p>
      )}

      <h3 className={`${sectionTitle} mb-2`}>Transaksi terakhir</h3>
      {orders && orders.length === 0 ? (
        <p className="text-[14px] text-muted">Belum ada transaksi.</p>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line">
          {orders?.slice(0, RECENT_ORDERS).map((order) => (
            <li key={order.id} className="flex items-center gap-3 px-3.5 py-2.5">
              <span className="min-w-0 flex-1">
                <span className="num block truncate text-[14px] font-semibold">{order.receiptNo}</span>
                <span className="block truncate text-[13px] text-muted">{order.items.map((i) => `${i.qty}× ${i.nameSnapshot}`).join(', ')}</span>
              </span>
              <span className="flex flex-col items-end gap-1">
                <span className="num text-[14px] font-semibold">{formatRupiah(order.totals.grandTotal)}</span>
                {order.status !== 'paid' && <StatusBadge status={order.status} />}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
