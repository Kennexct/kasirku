import { EXPENSE_CATEGORY_LABEL, ORDER_STATUS_LABEL, REFUND_REASON_LABEL } from '../../constants';
import { lineTotal } from '../pricing';
import type { Profit } from '../profit';
import type { ReportInput } from '../reports';
import type { Expense, Order, OrderItem, Refund } from '../../types';
import { t } from '../../i18n';
import { countUnits, roundQuantity, UNIT_INFO } from '../quantity';

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
  transactions: t('Transaksi'),
  items: t('Item'),
  refunds: t('Refund'),
};

/** Leading = + - @ TAB CR make spreadsheet apps evaluate text as a formula (CSV/formula injection). */
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;
export const sanitizeText = (value: string): string => (FORMULA_TRIGGER.test(value) ? `'${value}` : value);

export interface ExportContext {
  input: ReportInput;
  timeZone: string;
  /** Profit statement and the period's expenses (ADR-007); absent in older callers and tests. */
  profit?: Profit;
  expenses?: readonly Expense[];
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
  { header: t('Tanggal'), width: 12, kind: 'text', value: (r) => r.order.businessDate },
  { header: t('Jam'), width: 7, kind: 'text', value: (r) => r.time },
  { header: t('No. Struk'), width: 22, kind: 'text', value: (r) => r.order.receiptNo },
  { header: t('Status'), width: 16, kind: 'text', value: (r) => ORDER_STATUS_LABEL[r.order.status] },
  { header: t('Mode'), width: 12, kind: 'text', value: (r) => r.order.salesModeNameSnapshot },
  { header: t('Label'), width: 16, kind: 'text', value: (r) => r.order.label },
  // ADR-005: customer name only — phone numbers are never exported.
  { header: t('Pelanggan::satu'), width: 18, kind: 'text', value: (r) => r.order.customerNameSnapshot ?? '' },
  { header: t('Kasir::orang'), width: 14, kind: 'text', value: (r) => r.cashier },
  { header: t('Metode'), width: 14, kind: 'text', value: (r) => methodOf(r.order) },
  { header: t('Referensi'), width: 14, kind: 'text', value: (r) => r.order.payments[0]?.reference ?? '' },
  { header: t('Item'), width: 7, kind: 'int', value: (r) => countUnits(r.order.items) },
  { header: t('Subtotal'), width: 12, kind: 'money', value: (r) => r.order.totals.subtotal },
  { header: t('Diskon'), width: 11, kind: 'money', value: (r) => r.order.totals.itemDiscountTotal + r.order.totals.orderDiscountTotal },
  { header: t('Service'), width: 10, kind: 'money', value: (r) => r.order.totals.serviceTotal },
  { header: t('Pajak'), width: 10, kind: 'money', value: (r) => r.order.totals.taxTotal },
  { header: t('Total'), width: 12, kind: 'money', value: (r) => r.order.totals.grandTotal },
];

export const ITEM_COLUMNS: ReadonlyArray<ExportColumn<ItemRow>> = [
  { header: t('Tanggal'), width: 12, kind: 'text', value: (r) => r.order.businessDate },
  { header: t('No. Struk'), width: 22, kind: 'text', value: (r) => r.order.receiptNo },
  { header: t('Status'), width: 16, kind: 'text', value: (r) => ORDER_STATUS_LABEL[r.order.status] },
  { header: t('Produk'), width: 22, kind: 'text', value: (r) => r.item.nameSnapshot },
  { header: t('Add-on'), width: 22, kind: 'text', value: (r) => r.item.options.map((o) => o.name).join(', ') },
  { header: t('Catatan'), width: 18, kind: 'text', value: (r) => r.item.note },
  { header: t('Qty'), width: 8, kind: 'int', value: (r) => roundQuantity(r.item.qty) },
  { header: t('Harga Satuan'), width: 13, kind: 'money', value: (r) => r.item.unitPrice },
  { header: t('Total Baris'), width: 13, kind: 'money', value: (r) => lineTotal(r.item) },
  // Appended so existing columns keep their positions (ADR-011).
  { header: t('Satuan'), width: 8, kind: 'text', value: (r) => UNIT_INFO[r.item.unit ?? 'pcs'].symbol || 'pcs' },
  { header: t('Harga Normal'), width: 13, kind: 'money', value: (r) => r.item.listPrice ?? r.item.unitPrice },
  { header: t('Varian'), width: 16, kind: 'text', value: (r) => r.item.variantName ?? '' },
];

export const REFUND_COLUMNS: ReadonlyArray<ExportColumn<RefundRow>> = [
  { header: t('Tanggal Refund'), width: 14, kind: 'text', value: (r) => r.refund.businessDate },
  { header: t('Jenis'), width: 8, kind: 'text', value: (r) => (r.refund.kind === 'void' ? t('Void') : t('Refund')) },
  { header: t('No. Struk'), width: 22, kind: 'text', value: (r) => r.order?.receiptNo ?? '' },
  { header: t('Tanggal Penjualan'), width: 16, kind: 'text', value: (r) => r.order?.businessDate ?? '' },
  { header: t('Metode Asal'), width: 14, kind: 'text', value: (r) => methodOf(r.order) },
  { header: t('Item'), width: 7, kind: 'int', value: (r) => countUnits(r.refund.items.map((i) => ({ qty: i.qty, unit: r.order?.items.find((line) => line.id === i.orderItemId)?.unit }))) },
  { header: t('Jumlah'), width: 12, kind: 'money', value: (r) => r.refund.amount },
  { header: t('Alasan'), width: 16, kind: 'text', value: (r) => REFUND_REASON_LABEL[r.refund.reasonCode] },
  { header: t('Catatan'), width: 22, kind: 'text', value: (r) => r.refund.reasonNote },
  { header: t('Oleh'), width: 14, kind: 'text', value: (r) => r.actor },
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

export const EXPENSE_COLUMNS: ReadonlyArray<ExportColumn<{ expense: Expense; actor: string }>> = [
  { header: t('Tanggal'), kind: 'text', width: 12, value: ({ expense }) => expense.businessDate },
  { header: t('Kategori'), kind: 'text', width: 24, value: ({ expense }) => EXPENSE_CATEGORY_LABEL[expense.category] },
  { header: t('Catatan'), kind: 'text', width: 32, value: ({ expense }) => expense.note },
  { header: t('Dari laci'), kind: 'text', width: 10, value: ({ expense }) => (expense.isFromDrawer ? t('Ya') : t('Tidak')) },
  { header: t('Jumlah'), kind: 'money', width: 14, value: ({ expense }) => expense.amount },
  { header: t('Dicatat oleh'), kind: 'text', width: 18, value: ({ actor }) => actor },
];

/** Oldest first, like the other ledgers. */
export function expenseRows({ input, expenses = [] }: ExportContext): Array<{ expense: Expense; actor: string }> {
  return [...expenses]
    .sort((a, b) => a.businessDate.localeCompare(b.businessDate) || a.createdAt.localeCompare(b.createdAt))
    .map((expense) => ({ expense, actor: input.memberName.get(expense.actorId) ?? '' }));
}
