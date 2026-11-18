# Product Manager — reports-export (M12–M13)

## User stories
1. As an owner, I see today's net sales, transactions and average ticket at a glance so I know if today was good.
2. As an owner, I see totals per payment method so I can match QRIS/transfer against my bank mutation.
3. As an owner, I see peak hours and best sellers so I can prep stock and staff.
4. As an owner, I export a period to Excel/PDF/CSV and share it (WhatsApp) with my accountant or for a KUR loan application.
5. As an owner, a refund given today reduces today's numbers (cash basis).

## Acceptance criteria
- Period presets (Hari ini, Kemarin, 7 hari, Bulan ini, custom ≤ 366 days) identical to History.
- KPIs: net, gross, transactions, average, discounts, refunds, voids.
- Breakdowns: payment method (gross/refund/net), sales mode, by hour, by day (when > 1 day), top 10 products (qty/revenue toggle), cashier.
- Export: CSV (Transaksi/Item/Refund), XLSX (5 sheets, amounts numeric), PDF summary; file named with store + range; works offline after first load.
- History summary uses the same refund-date rule and definitions.
- Owner-only.

## Success metrics (from PRD)
- ≥ 30% of merchants view or export a report weekly.

## Out of scope
Profit/COGS, period comparison, scheduled/email reports, server-side export, multi-device aggregation (needs M15 sync pull).
