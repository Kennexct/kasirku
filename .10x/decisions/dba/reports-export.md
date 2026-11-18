# DBA — reports-export

## Schema
- `refunds.business_date date not null` (migration `20261118010000_refund_business_date.sql`), backfilled with `((created_at at time zone stores.timezone) - stores.day_cutoff)::date` — mirrors `getBusinessDate()` in TS.
- Index `refunds_store_business_date_idx (store_id, business_date)` for period queries.
- `daily_sales` view redefined: sales CTE by order business date + refunds CTE by refund business date, FULL OUTER JOIN so a day with only refunds still appears (net can be negative). `security_invoker = true` keeps RLS.

## Local (Dexie)
- Schema v3: `refunds` gains `[storeId+businessDate]`; upgrade backfills `businessDate` from `createdAt` (UTC date) — acceptable because only pre-release dev data exists. Real devices will have been created with v3 code.

## Migration safety
- Additive column → backfill → `set not null` in one migration; safe while the table is small (pre-launch). For large tables later: backfill in batches before `not null`.
- Both migrations parse (pglast). Not yet applied to a live Supabase project (backend not provisioned).

## Query notes
- Reports read ≤ 366 days via compound index ranges (`between`) — no full scans. Refund orders outside the range fetched with `bulkGet` (O(k)).
