# Architect — reports-export

ADRs: **ADR-001** (on-device export, lazy libs), **ADR-002** (refunds by refund business date).

## Components
| Unit | Purpose | Depends on |
| --- | --- | --- |
| `lib/reports.ts` | `buildReport(input): Report` — all metric definitions (pure) | `lib/pricing` (lineTotal), timezone for hour buckets |
| `hooks/useReportData.ts` | Live Dexie query: sales by `[storeId+businessDate]`, refunds by `[storeId+businessDate]`, missing refund orders via `bulkGet`, members | Dexie v3 |
| `lib/export/columns.ts` | Column definitions for Transaksi / Item / Refund datasets (shared by CSV + XLSX) | Report input |
| `lib/export/csv.ts` | `toCsv(rows, columns)` + injection guard (pure) | columns |
| `lib/export/xlsx.ts` | lazy `write-excel-file`; sheets Ringkasan/Transaksi/Item/Refund/Per Produk | columns, Report |
| `lib/export/pdf.ts` | lazy `jspdf` + autotable summary | Report |
| `lib/export/deliver.ts` | share-or-download a Blob | browser APIs |
| `pages/Reports/*` | lazy route: range picker, KPI tiles, charts, tables, export sheet | all above |
| `components/ui/DateRangeControl` + `StatTile` | extracted from History (DRY) | dateRange |

## Data flow
Dexie → useReportData → buildReport → (UI | exporters). History summary also calls the same summary function with refund-date refunds.

## Failure modes
- Lazy chunk load fails offline → caught, toast, no crash.
- Range too large → validateRange blocks before querying.
- Refund whose order isn't on this device (future sync) → counted in totals; attributed to "Tidak diketahui" method.
- Timezone: hour buckets use store timezone via `Intl.DateTimeFormat`, never device timezone.
