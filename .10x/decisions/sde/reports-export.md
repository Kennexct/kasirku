# SDE — reports-export (what was built)

## Built
| Task | Files |
| --- | --- |
| T1 Refund business date | `types` (`Refund.businessDate`), `db/localDb.ts` (v3 + upgrade), `services/refunds.ts`, `supabase/migrations/20261118010000_refund_business_date.sql` |
| T2 Report engine | `lib/reports.ts` (+ `reports.test.ts`, `reports.perf.test.ts`) |
| T3 History alignment | `hooks/usePeriodData.ts` (replaces `useOrderHistory`), History uses `summarize()`; `lib/salesSummary.ts` removed |
| T4 Shared UI | `hooks/useDateRange.ts`, `components/ui/DateRangeControl.tsx`, `components/ui/StatTile.tsx` |
| T5 Export | `lib/export/{columns,csv,xlsx,pdf,deliver,index}.ts` (+ `export.test.ts`) |
| T6 Reports page | `pages/Reports/{ReportsPage,BarChartCard,BreakdownTable,TopProducts,ExportSheet}.tsx`, lazy route in `App.tsx`, `lib/niceTicks.ts` |
| T7 e2e | `e2e/reports.py` (downloads verified with openpyxl / PDF magic / csv) |

## Deviations from plan
- **XLSX library:** `write-excel-file` instead of `exceljs` (ADR-001 records why) — 15 KB gz chunk.
- **Top products** rendered as a ranked list with thin bars, not a chart (≤ 10 names read faster as a list — dataviz "is it even a chart?").
- **Hour chart window:** active hours ±1, widened to ≥ 8 hours so a single busy hour still shows context.
- **Perf fix:** `Intl.DateTimeFormat` cached per timezone in CSV time column (20k rows: 1234 → 207 ms).

## Bundle (gzip)
POS/main 157.1 KB (budget 250) · Reports route 124.1 KB (lazy) · xlsx 15.0 KB (lazy) · pdf 136.9 KB (lazy).

## Tech debt
- Share sheet path (`navigator.share` with files) not automatable on Linux Chrome — needs a manual Android check.
- PDF uses Helvetica (no Plus Jakarta Sans embed) — acceptable for a data document.
- Breakdown "share" bar uses net; negative net rows (refund-only) show 0 % — documented behaviour.
