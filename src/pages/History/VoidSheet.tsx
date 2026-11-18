import { TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { Sheet } from '../../components/ui/Sheet';
import { btnDangerSolid, btnSecondary } from '../../components/ui/styles';
import { formatRupiah } from '../../lib/money';
import type { ReasonInput } from '../../services/refunds';
import type { Order } from '../../types';
import { ReasonPicker } from './ReasonPicker';

interface VoidSheetProps {
  order: Order;
  isSubmitting: boolean;
  onConfirm: (reason: ReasonInput) => void;
  onClose: () => void;
}

export function VoidSheet({ order, isSubmitting, onConfirm, onClose }: VoidSheetProps) {
  const [reason, setReason] = useState<ReasonInput>({ code: 'wrong_input', note: '' });
  const method = order.payments[0]?.methodNameSnapshot ?? 'pembayaran awal';

  return (
    <Sheet
      title="Void transaksi"
      subtitle={order.receiptNo}
      isOpen
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className={btnSecondary}>Kembali</button>
          <button type="button" disabled={isSubmitting} onClick={() => onConfirm(reason)} className={`${btnDangerSolid} flex-1`}>
            {isSubmitting ? 'Memproses…' : `Void ${formatRupiah(order.totals.grandTotal)}`}
          </button>
        </div>
      }
    >
      <div className="mb-5 flex gap-3 rounded-lg border border-danger-200 bg-danger-50 p-3.5 text-[14px] text-danger-700">
        <TriangleAlert aria-hidden size={20} className="mt-0.5 shrink-0" />
        <p>
          Seluruh transaksi dibatalkan dan <b className="num">{formatRupiah(order.totals.grandTotal)}</b> dikembalikan via {method}. Tindakan ini
          tidak bisa dibatalkan dan tercatat di log.
        </p>
      </div>
      <ReasonPicker value={reason} onChange={setReason} />
    </Sheet>
  );
}
