import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { PageHeader } from '../../components/Layout/PageHeader';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { useAppData } from '../../hooks/useAppData';
import { usePeriodData } from '../../hooks/usePeriodData';
import { getBusinessDate } from '../../lib/businessDate';
import { formatRange } from '../../lib/dateRange';
import { useDateRange } from '../../hooks/useDateRange';
import { summarize } from '../../lib/reports';
import { canRefund, canVoid, refundOrder, voidOrder, type ReasonInput, type RefundContext } from '../../services/refunds';
import { useSessionStore } from '../../store/useSessionStore';
import type { Id, Order } from '../../types';
import { EMPTY_FILTER, HistoryFilters, isFilterEmpty, type HistoryFilter } from './HistoryFilters';
import { HistoryList } from './HistoryList';
import { HistorySummary } from './HistorySummary';
import { OrderDetailSheet } from './OrderDetailSheet';
import { RefundSheet } from './RefundSheet';
import { VoidSheet } from './VoidSheet';

type Action = 'detail' | 'void' | 'refund';

function matchesFilter(order: Order, filter: HistoryFilter): boolean {
  const query = filter.query.trim().toLowerCase();
  return (
    (filter.status === 'all' || order.status === filter.status) &&
    (filter.paymentMethodId === 'all' || order.payments.some((p) => p.paymentMethodId === filter.paymentMethodId)) &&
    (filter.salesModeId === 'all' || order.salesModeId === filter.salesModeId) &&
    (query === '' || order.receiptNo.toLowerCase().includes(query) || order.label.toLowerCase().includes(query))
  );
}

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Terjadi kesalahan.');

/** M10 sales history + M11 void/refund entry point. */
export function HistoryPage() {
  const { store, catalog } = useAppData();
  const storeId = useSessionStore((s) => s.storeId);
  const cashier = useSessionStore((s) => s.cashier);
  const today = store ? getBusinessDate(new Date(), store) : new Date().toISOString().slice(0, 10);

  const dateRange = useDateRange(today);
  const { range } = dateRange;
  const [filter, setFilter] = useState<HistoryFilter>(EMPTY_FILTER);
  const [selected, setSelected] = useState<{ id: Id; action: Action } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const history = usePeriodData(storeId, range);

  const filtered = useMemo(() => history?.sales.filter((o) => matchesFilter(o, filter)) ?? [], [history, filter]);
  // ADR-002: refunds count on their own day; a filter applies to a refund through its original order.
  const summary = useMemo(() => {
    const refunds = (history?.refundsInRange ?? []).filter((r) => {
      const original = history?.ordersById.get(r.orderId);
      return original ? matchesFilter(original, filter) : isFilterEmpty(filter);
    });
    return summarize(filtered, refunds);
  }, [filtered, history, filter]);

  if (!store || !catalog || !cashier) return <LoadingScreen />;

  const ctx: RefundContext = { store, actorId: cashier.memberId, actorRole: cashier.role };
  const order = selected ? history?.ordersById.get(selected.id) : undefined;
  const refunds = (order && history?.refundsByOrder.get(order.id)) || [];

  const run = async (task: () => Promise<unknown>, success: string) => {
    setIsSubmitting(true);
    try {
      await task();
      toast.success(success);
      setSelected((prev) => (prev ? { ...prev, action: 'detail' } : prev));
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoid = (reason: ReasonInput) => order && void run(() => voidOrder(order.id, reason, ctx), `${order.receiptNo} di-void`);
  const handleRefund = (selections: Array<{ orderItemId: Id; qty: number }>, reason: ReasonInput) =>
    order && void run(() => refundOrder(order.id, selections, reason, ctx), 'Refund berhasil dicatat');

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <PageHeader title="Riwayat penjualan" description={formatRange(range)}>
        <HistoryFilters
          dateRange={dateRange}
          today={today}
          filter={filter}
          onFilterChange={setFilter}
          paymentMethods={catalog.paymentMethods}
          salesModes={catalog.salesModes}
        />
      </PageHeader>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 md:px-8 md:py-6">
        {history === undefined ? (
          <LoadingScreen />
        ) : (
          <div className="flex flex-col gap-4">
            <HistorySummary summary={summary} />
            <HistoryList orders={filtered} onSelect={(id) => setSelected({ id, action: 'detail' })} />
          </div>
        )}
      </div>

      {order && selected?.action === 'detail' && (
        <OrderDetailSheet
          order={order}
          refunds={refunds}
          store={store}
          cashierName={history?.memberName.get(order.cashierId) ?? '—'}
          voidEligibility={canVoid(order, refunds, ctx)}
          refundEligibility={canRefund(order, ctx)}
          onVoid={() => setSelected({ id: order.id, action: 'void' })}
          onRefund={() => setSelected({ id: order.id, action: 'refund' })}
          onClose={() => setSelected(null)}
        />
      )}
      {order && selected?.action === 'void' && (
        <VoidSheet order={order} isSubmitting={isSubmitting} onConfirm={handleVoid} onClose={() => setSelected({ id: order.id, action: 'detail' })} />
      )}
      {order && selected?.action === 'refund' && (
        <RefundSheet order={order} refunds={refunds} isSubmitting={isSubmitting} onConfirm={handleRefund} onClose={() => setSelected({ id: order.id, action: 'detail' })} />
      )}
    </section>
  );
}
