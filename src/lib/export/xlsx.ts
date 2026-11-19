import writeXlsxFile, { type Sheet } from 'write-excel-file/universal';
import { formatRange } from '../dateRange';
import { profitLines, type Profit } from '../profit';
import type { BreakdownRow, Report } from '../reports';
import {
  EXPENSE_COLUMNS,
  ITEM_COLUMNS,
  REFUND_COLUMNS,
  TRANSACTION_COLUMNS,
  expenseRows,
  itemRows,
  refundRows,
  sanitizeText,
  transactionRows,
  type CellKind,
  type ExportColumn,
  type ExportContext,
} from './columns';
import { t } from '../../i18n';

/** Loaded with `import()` only when exporting (ADR-001). */
type Cell = { value: string | number; type: StringConstructor | NumberConstructor; format?: string; fontWeight?: 'bold' } | null;
type Row = Cell[];

const MONEY_FORMAT = '#,##0';

const text = (value: string, isBold = false): Cell => ({ value: sanitizeText(value), type: String, ...(isBold ? { fontWeight: 'bold' as const } : {}) });
const money = (value: number, isBold = false): Cell => ({ value, type: Number, format: MONEY_FORMAT, ...(isBold ? { fontWeight: 'bold' as const } : {}) });
const int = (value: number): Cell => ({ value, type: Number });

function cellFor(kind: CellKind, value: string | number): Cell {
  if (kind === 'text') return text(String(value));
  return kind === 'money' ? money(Number(value)) : int(Number(value));
}

function tableSheet<T>(name: string, columns: ReadonlyArray<ExportColumn<T>>, rows: readonly T[]): Sheet<Blob> {
  return {
    sheet: name,
    stickyRowsCount: 1,
    columns: columns.map((c) => ({ width: c.width })),
    data: [columns.map((c) => text(c.header, true)), ...rows.map((row) => columns.map((c) => cellFor(c.kind, c.value(row))))],
  };
}

function breakdownRows(title: string, rows: readonly BreakdownRow[]): Row[] {
  return [
    [null],
    [text(title, true)],
    [text(t('Nama'), true), text(t('Transaksi'), true), text(t('Penjualan'), true), text(t('Refund'), true), text(t('Bersih'), true)],
    ...rows.map((r) => [text(r.label), int(r.transactions), money(r.gross), money(r.refunds), money(r.net)]),
  ];
}

/** Profit statement rows (ADR-007); empty when there are neither cost prices nor expenses. */
function profitRows(profit: Profit | undefined): Row[] {
  if (!profit || profit.mode === 'none') return [];
  return [
    [null],
    [text(profit.mode === 'cost' ? t('Laba (perkiraan)') : t('Penjualan dan pengeluaran'), true)],
    ...profitLines(profit).map((line): Row => [text(line.label, line.kind !== 'plain'), money(line.amount, line.kind !== 'plain')]),
    ...(profit.mode === 'cost' && profit.uncostedQty > 0 ? [[text(t('{0} item terjual belum punya harga modal; laba bisa terlihat lebih besar.', profit.uncostedQty))]] : []),
    ...(profit.mode === 'cost' && profit.ingredientExpenses > 0 ? [[text(t('Belanja bahan tidak dikurangkan lagi (sudah terhitung lewat harga modal).')), money(profit.ingredientExpenses)]] : []),
  ];
}

function summarySheet(storeName: string, report: Report, profit: Profit | undefined): Sheet<Blob> {
  const s = report.summary;
  const line = (label: string, value: number, isMoney = true): Row => [text(label), isMoney ? money(value) : int(value)];
  return {
    sheet: t('Ringkasan'),
    columns: [{ width: 28 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }],
    data: [
      [text(t('Laporan Penjualan — {0}', storeName), true)],
      [text(formatRange(report.range))],
      [text(t('Refund dihitung pada tanggal refund dilakukan (basis kas).'))],
      [null],
      line(t('Penjualan kotor'), s.grossSales),
      line(t('Diskon'), s.discounts),
      line(t('Refund'), s.refunds),
      [text(t('Penjualan bersih'), true), money(s.netSales, true)],
      line(t('Transaksi'), s.transactions, false),
      line(t('Rata-rata per transaksi'), s.averageTicket),
      line(t('Item terjual'), s.itemsSold, false),
      line(t('Void (jumlah)'), s.voidCount, false),
      line(t('Void (nilai)'), s.voidAmount),
      line(t('Service'), s.serviceTotal),
      line(t('Pajak'), s.taxTotal),
      ...profitRows(profit),
      ...breakdownRows(t('Per metode pembayaran'), report.byPaymentMethod),
      ...breakdownRows(t('Per mode penjualan'), report.bySalesMode),
      ...breakdownRows(t('Per kasir'), report.byCashier),
    ],
  };
}

function productSheet(report: Report): Sheet<Blob> {
  return {
    sheet: t('Per Produk'),
    stickyRowsCount: 1,
    columns: [{ width: 28 }, { width: 8 }, { width: 14 }],
    data: [
      [text(t('Produk'), true), text(t('Qty'), true), text(t('Pendapatan'), true)],
      ...report.products.map((p) => [text(p.name), int(p.qty), money(p.revenue)]),
    ],
  };
}

export function buildXlsx(storeName: string, report: Report, ctx: ExportContext): Promise<Blob> {
  const sheets: Sheet<Blob>[] = [
    summarySheet(storeName, report, ctx.profit),
    tableSheet(t('Transaksi'), TRANSACTION_COLUMNS, transactionRows(ctx)),
    tableSheet(t('Item'), ITEM_COLUMNS, itemRows(ctx)),
    tableSheet(t('Refund'), REFUND_COLUMNS, refundRows(ctx)),
    productSheet(report),
    // Only when there is something to list, so stores that never record expenses keep the familiar five sheets.
    ...(ctx.expenses && ctx.expenses.length > 0 ? [tableSheet(t('Pengeluaran'), EXPENSE_COLUMNS, expenseRows(ctx))] : []),
  ];
  return writeXlsxFile(sheets).toBlob();
}
