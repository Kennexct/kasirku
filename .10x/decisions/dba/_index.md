# DBA — index

[DISCOVERED] Postgres schema `supabase/migrations/20261118000000_init.sql`: store-scoped tables, RLS via `is_store_member` / `is_store_owner`, no DELETE policies, `orders_immutability` trigger, views `order_lines`, `daily_sales`, storage buckets.
[DISCOVERED] Orders store items/payments/totals as JSONB snapshots; `grand_total` generated column.
[DISCOVERED] Local Dexie schema v2 (`src/db/localDb.ts`): compound indexes `[storeId+businessDate]`, `[storeId+status]`.
