import {
  ITEM_COLUMNS,
  REFUND_COLUMNS,
  TRANSACTION_COLUMNS,
  itemRows,
  refundRows,
  sanitizeText,
  transactionRows,
  type Dataset,
  type ExportColumn,
  type ExportContext,
} from './columns';

const BOM = '﻿'; // makes Excel open UTF-8 (Indonesian text, "–") correctly
const NEEDS_QUOTES = /[",\r\n]/;

export function csvCell(value: string | number): string {
  if (typeof value === 'number') return String(value);
  const safe = sanitizeText(value);
  return NEEDS_QUOTES.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** RFC 4180 CSV with CRLF line endings and a UTF-8 BOM. Numbers are written raw (no thousand separators). */
export function toCsv<T>(columns: ReadonlyArray<ExportColumn<T>>, rows: readonly T[]): string {
  const header = columns.map((c) => csvCell(c.header)).join(',');
  const body = rows.map((row) => columns.map((c) => csvCell(c.value(row))).join(','));
  return BOM + [header, ...body].join('\r\n') + '\r\n';
}

export function datasetCsv(dataset: Dataset, ctx: ExportContext): string {
  switch (dataset) {
    case 'transactions':
      return toCsv(TRANSACTION_COLUMNS, transactionRows(ctx));
    case 'items':
      return toCsv(ITEM_COLUMNS, itemRows(ctx));
    case 'refunds':
      return toCsv(REFUND_COLUMNS, refundRows(ctx));
  }
}

export const csvBlob = (dataset: Dataset, ctx: ExportContext): Blob =>
  new Blob([datasetCsv(dataset, ctx)], { type: 'text/csv;charset=utf-8' });
