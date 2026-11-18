# SRE — reports-export

- **Nature:** client-only feature; no new server endpoint → no new availability SLO. Data correctness is the reliability concern.
- **SLIs to add with Sentry (planned NFR):** export success rate (`buildExport` success/failure by format), export duration p95 by row count, chunk-load failures. Target: ≥ 99% export success, p95 < 3 s for ≤ 31-day ranges on mid-range Android.
- **Alerts (when Sentry lands):** chunk-load failure spike after deploy (> 2% of export attempts in 1 h) → likely stale chunks; consider `deadline`-based SW update.
- **Correctness guard:** History and Reports share `summarize()`; SQL `daily_sales` mirrors the same definitions — a reconciliation query can compare server vs client totals once sync exists.
- **Runbook:** `docs/runbooks/reports-export.md`.
