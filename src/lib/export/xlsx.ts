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
    [text('Nama', true), text('Transaksi', true), text('Penjualan', true), text('Refund', true), text('Bersih', true)],
    ...rows.map((r) => [text(r.label), int(r.transactions), money(r.gross), money(r.refunds), money(r.net)]),
  ];
}

/** Profit statement rows (ADR-007); empty when there are neither cost prices nor expenses. */
function profitRows(profit: Profit | undefined): Row[] {
  if (!profit || profit.mode === 'none') return [];
  return [
    [null],
    [text(profit.mode === 'cost' ? 'Laba (perkiraan)' : 'Penjualan dan pengeluaran', true)],
    ...profitLines(profit).map((line): Row => [text(line.label, line.kind !== 'plain'), money(line.amount, line.kind !== 'plain')]),
    ...(profit.mode === 'cost' && profit.uncostedQty > 0 ? [[text(`${profit.uncostedQty} item terjual belum punya harga modal; laba bisa terlihat lebih besar.`)]] : []),
    ...(profit.mode === 'cost' && profit.ingredientExpenses > 0 ? [[text('Belanja bahan tidak dikurangkan lagi (sudah terhitung lewat harga modal).'), money(profit.ingredientExpenses)]] : []),
  ];
}

function summarySheet(storeName: string, report: Report, profit: Profit | undefined): Sheet<Blob> {
  const s = report.summary;
  const line = (label: string, value: number, isMoney = true): Row => [text(label), isMoney ? money(value) : int(value)];
  return {
    sheet: 'Ringkasan',
    columns: [{ width: 28 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }],
    data: [
      [text(`Laporan Penjualan — ${storeName}`, true)],
      [text(formatRange(report.range))],
      [text('Refund dihitung pada tanggal refund dilakukan (basis kas).')],
      [null],
      line('Penjualan kotor', s.grossSales),
      line('Diskon', s.discounts),
      line('Refund', s.refunds),
      [text('Penjualan bersih', true), money(s.netSales, true)],
      line('Transaksi', s.transactions, false),
      line('Rata-rata per transaksi', s.averageTicket),
      line('Item terjual', s.itemsSold, false),
      line('Void (jumlah)', s.voidCount, false),
      line('Void (nilai)', s.voidAmount),
      line('Service', s.serviceTotal),
      line('Pajak', s.taxTotal),
      ...profitRows(profit),
      ...breakdownRows('Per metode pembayaran', report.byPaymentMethod),
      ...breakdownRows('Per mode penjualan', report.bySalesMode),
      ...breakdownRows('Per kasir', report.byCashier),
    ],
  };
}

function productSheet(report: Report): Sheet<Blob> {
  return {
    sheet: 'Per Produk',
    stickyRowsCount: 1,
    columns: [{ width: 28 }, { width: 8 }, { width: 14 }],
    data: [
      [text('Produk', true), text('Qty', true), text('Pendapatan', true)],
      ...report.products.map((p) => [text(p.name), int(p.qty), money(p.revenue)]),
    ],
  };
}

export function buildXlsx(storeName: string, report: Report, ctx: ExportContext): Promise<Blob> {
  const sheets: Sheet<Blob>[] = [
    summarySheet(storeName, report, ctx.profit),
    tableSheet('Transaksi', TRANSACTION_COLUMNS, transactionRows(ctx)),
    tableSheet('Item', ITEM_COLUMNS, itemRows(ctx)),
    tableSheet('Refund', REFUND_COLUMNS, refundRows(ctx)),
    productSheet(report),
    // Only when there is something to list, so stores that never record expenses keep the familiar five sheets.
    ...(ctx.expenses && ctx.expenses.length > 0 ? [tableSheet('Pengeluaran', EXPENSE_COLUMNS, expenseRows(ctx))] : []),
  ];
  return writeXlsxFile(sheets).toBlob();
}
