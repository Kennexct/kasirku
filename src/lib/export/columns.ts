import { ORDER_STATUS_LABEL, REFUND_REASON_LABEL } from '../../constants';
import { lineTotal } from '../pricing';
import type { ReportInput } from '../reports';
import type { Order, OrderItem, Refund } from '../../types';

/**
 * Column definitions shared by CSV and XLSX (ADR-001) — one place decides what a dataset contains.
 * `kind` drives typing: money/int stay numeric (summable in Excel); text is sanitized by the writer.
 */
export type CellKind = 'text' | 'money' | 'int';

export interface ExportColumn<T> {
  header: string;
  width: number;
  kind: CellKind;
  value: (row: T) => string | number;
}

export const DATASETS = ['transactions', 'items', 'refunds'] as const;
export type Dataset = (typeof DATASETS)[number];

export const DATASET_LABEL: Record<Dataset, string> = {
  transactions: 'Transaksi',
  items: 'Item',
  refunds: 'Refund',
};

/** Leading = + - @ TAB CR make spreadsheet apps evaluate text as a formula (CSV/formula injection). */
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;
export const sanitizeText = (value: string): string => (FORMULA_TRIGGER.test(value) ? `'${value}` : value);

export interface ExportContext {
  input: ReportInput;
  timeZone: string;
}

const timeFormatters = new Map<string, Intl.DateTimeFormat>();

/** Intl formatters are expensive to construct — cache one per timezone (20k-row exports). */
function timeOf(iso: string | null, timeZone: string): string {
  if (!iso) return '';
  let format = timeFormatters.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone });
    timeFormatters.set(timeZone, format);
  }
  return format.format(new Date(iso));
}

const methodOf = (order: Order | undefined) => order?.payments[0]?.methodNameSnapshot ?? '';

export type TransactionRow = { order: Order; cashier: string; time: string };
export type ItemRow = { order: Order; item: OrderItem };
export type RefundRow = { refund: Refund; order: Order | undefined; actor: string };

export const TRANSACTION_COLUMNS: ReadonlyArray<ExportColumn<TransactionRow>> = [
  { header: 'Tanggal', width: 12, kind: 'text', value: (r) => r.order.businessDate },
  { header: 'Jam', width: 7, kind: 'text', value: (r) => r.time },
  { header: 'No. Struk', width: 22, kind: 'text', value: (r) => r.order.receiptNo },
  { header: 'Status', width: 16, kind: 'text', value: (r) => ORDER_STATUS_LABEL[r.order.status] },
  { header: 'Mode', width: 12, kind: 'text', value: (r) => r.order.salesModeNameSnapshot },
  { header: 'Label', width: 16, kind: 'text', value: (r) => r.order.label },
  { header: 'Kasir', width: 14, kind: 'text', value: (r) => r.cashier },
  { header: 'Metode', width: 14, kind: 'text', value: (r) => methodOf(r.order) },
  { header: 'Referensi', width: 14, kind: 'text', value: (r) => r.order.payments[0]?.reference ?? '' },
  { header: 'Item', width: 7, kind: 'int', value: (r) => r.order.items.reduce((s, i) => s + i.qty, 0) },
  { header: 'Subtotal', width: 12, kind: 'money', value: (r) => r.order.totals.subtotal },
  { header: 'Diskon', width: 11, kind: 'money', value: (r) => r.order.totals.itemDiscountTotal + r.order.totals.orderDiscountTotal },
  { header: 'Service', width: 10, kind: 'money', value: (r) => r.order.totals.serviceTotal },
  { header: 'Pajak', width: 10, kind: 'money', value: (r) => r.order.totals.taxTotal },
  { header: 'Total', width: 12, kind: 'money', value: (r) => r.order.totals.grandTotal },
];

export const ITEM_COLUMNS: ReadonlyArray<ExportColumn<ItemRow>> = [
  { header: 'Tanggal', width: 12, kind: 'text', value: (r) => r.order.businessDate },
  { header: 'No. Struk', width: 22, kind: 'text', value: (r) => r.order.receiptNo },
  { header: 'Status', width: 16, kind: 'text', value: (r) => ORDER_STATUS_LABEL[r.order.status] },
  { header: 'Produk', width: 22, kind: 'text', value: (r) => r.item.nameSnapshot },
  { header: 'Varian', width: 22, kind: 'text', value: (r) => r.item.options.map((o) => o.name).join(', ') },
  { header: 'Catatan', width: 18, kind: 'text', value: (r) => r.item.note },
  { header: 'Qty', width: 6, kind: 'int', value: (r) => r.item.qty },
  { header: 'Harga Satuan', width: 13, kind: 'money', value: (r) => r.item.unitPrice },
  { header: 'Total Baris', width: 13, kind: 'money', value: (r) => lineTotal(r.item) },
];

export const REFUND_COLUMNS: ReadonlyArray<ExportColumn<RefundRow>> = [
  { header: 'Tanggal Refund', width: 14, kind: 'text', value: (r) => r.refund.businessDate },
  { header: 'Jenis', width: 8, kind: 'text', value: (r) => (r.refund.kind === 'void' ? 'Void' : 'Refund') },
  { header: 'No. Struk', width: 22, kind: 'text', value: (r) => r.order?.receiptNo ?? '' },
  { header: 'Tanggal Penjualan', width: 16, kind: 'text', value: (r) => r.order?.businessDate ?? '' },
  { header: 'Metode Asal', width: 14, kind: 'text', value: (r) => methodOf(r.order) },
  { header: 'Item', width: 7, kind: 'int', value: (r) => r.refund.items.reduce((s, i) => s + i.qty, 0) },
  { header: 'Jumlah', width: 12, kind: 'money', value: (r) => r.refund.amount },
  { header: 'Alasan', width: 16, kind: 'text', value: (r) => REFUND_REASON_LABEL[r.refund.reasonCode] },
  { header: 'Catatan', width: 22, kind: 'text', value: (r) => r.refund.reasonNote },
  { header: 'Oleh', width: 14, kind: 'text', value: (r) => r.actor },
];

/** Rows in chronological order (oldest first) — what accountants expect in a ledger. */
export function transactionRows({ input, timeZone }: ExportContext): TransactionRow[] {
  return [...input.sales]
    .sort((a, b) => (a.paidAt ?? a.updatedAt).localeCompare(b.paidAt ?? b.updatedAt))
    .map((order) => ({ order, cashier: input.memberName.get(order.cashierId) ?? '', time: timeOf(order.paidAt ?? order.updatedAt, timeZone) }));
}

export function itemRows(ctx: ExportContext): ItemRow[] {
  return transactionRows(ctx).flatMap(({ order }) => order.items.map((item) => ({ order, item })));
}

export function refundRows({ input }: ExportContext): RefundRow[] {
  return [...input.refunds]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((refund) => ({ refund, order: input.ordersById.get(refund.orderId), actor: input.memberName.get(refund.actorId) ?? '' }));
}
