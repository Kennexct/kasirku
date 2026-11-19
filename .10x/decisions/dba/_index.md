# DBA — index

[DISCOVERED] Postgres schema `supabase/migrations/20261118000000_init.sql`: store-scoped tables, RLS via `is_store_member` / `is_store_owner`, no DELETE policies, `orders_immutability` trigger, views `order_lines`, `daily_sales`, storage buckets.
[DISCOVERED] Orders store items/payments/totals as JSONB snapshots; `grand_total` generated column.
[DISCOVERED] Local Dexie schema v2 (`src/db/localDb.ts`): compound indexes `[storeId+businessDate]`, `[storeId+status]`.

## Features
- reports-export — refunds.business_date, daily_sales v2, Dexie v3 → `reports-export.md`
- staff-pin — recovery_hash column, column-privilege note for later → `staff-pin.md`
- customers — `orders.customer_name_snapshot text` (additive, parses; not applied — no project). Existing `customers` RLS + phone check reused.
- v0.9 cost price, expenses, day closings → `v09-profit-closing-backup.md`
- v0.12 unit, flexible price, order_lines view → `v12-flex-price-weight.md`
