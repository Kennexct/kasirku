import { ORDER_STATUS_LABEL } from '../../constants';
import type { OrderStatus } from '../../types';

const TONE: Record<OrderStatus, string> = {
  paid: 'bg-brand-50 text-brand-700',
  partial_refund: 'bg-warn-50 text-warn-700',
  refunded: 'bg-warn-50 text-warn-700',
  void: 'bg-danger-50 text-danger-700',
  cancelled: 'bg-subtle text-muted',
  open: 'bg-subtle text-ink-soft',
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-md px-2 text-[12px] font-semibold ${TONE[status]}`}>
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
