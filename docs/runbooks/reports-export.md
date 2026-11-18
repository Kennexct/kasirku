# Runbook — Reports & Export

## Symptoms → actions
| Symptom | Likely cause | Action |
| --- | --- | --- |
| Toast "Gagal memuat modul ekspor. Coba lagi saat online." | First export ever on this device while offline (lazy chunk not cached), or a deploy replaced chunk hashes while the app was open | Reconnect and retry; the service worker (autoUpdate) caches chunks after first load. If after a deploy: reload the app. |
| "Bagikan" button missing | Browser lacks `navigator.canShare({files})` (desktop/iOS older) | Expected — "Unduh" works everywhere. |
| Reports total ≠ cash in drawer | Refund given today for older sale is counted today (ADR-002) — check Refund tile; open orders are not sales | Explain cash-basis rule; check Pesanan for unpaid open orders. |
| Reports ≠ History numbers | Should be impossible (shared `summarize()` + `usePeriodData`) — History filters active? | Reset History filters; if still different, file a P1 bug with both screenshots. |
| Reports missing another device's sales | Sync pull not implemented (M15) | Expected until M15; UI says "transaksi di perangkat ini". |
| Export slow on old phone for a long range | Very large data (> ~50k orders) | Use shorter range or CSV; server-side export is the planned escalation (ADR-001). |

## Database
- Forward: `supabase db push` applies `20261118010000_refund_business_date.sql` after `20261118000000_init.sql`.
- Rollback (only if the migration must be reverted before any client writes `business_date`):
  ```sql
  drop view if exists public.daily_sales;
  -- recreate the v1 view from 20261118000000_init.sql (sale-date refunds)
  drop index if exists refunds_store_business_date_idx;
  alter table public.refunds drop column if exists business_date;
  ```
  Clients ≥ this release send `business_date`; rolling back the column after they sync would make upserts fail → roll forward instead.
