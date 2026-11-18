# Staff Engineer — reports-export

- **One definition rule:** no metric math outside `lib/reports.ts`. `lib/salesSummary.ts` becomes a thin wrapper (or is replaced) so History and Reports can never disagree.
- **DRY extraction:** date-range preset control and stat tile move from `pages/History` to `components/ui` and are reused by Reports.
- **Bundle discipline:** `React.lazy` for the Reports route; `await import()` for exporters; verify POS chunk size unchanged in build output.
- **Security:** export text cells pass through `sanitizeCell` (formula-injection guard) — enforced in the shared column layer, not per exporter.
- **Charts:** follow `dataviz` skill + design tokens (brand-600 single series, `muted` axes, tabular numbers, no legends for single series).
- **Testing pattern:** pure tests for reports/csv; xlsx read back with `read-excel-file` (dev dep); fake-indexeddb for refund `businessDate` write.
