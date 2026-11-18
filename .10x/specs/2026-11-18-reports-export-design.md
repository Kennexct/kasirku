# Reports & Export — Design (M12–M13)

**Date:** 2026-11-18 · **Feature slug:** `reports-export` · **Status:** Approved by user (refund attribution = A, export = A)

## Problem
Owners need to know, for any period: how much they really earned, how they were paid (to reconcile QRIS/transfer against the bank), when they are busiest, and what sells — and to hand that data to an accountant, a lender (KUR) or Excel. Today only the History summary exists, and it attributes refunds to the sale date.

## Decisions taken with the user
1. **Refunds count on the business day the refund happens** (cash basis). "Hari ini" matches the cash drawer. The History summary adopts the same rule.
2. **Exports are generated on the device** (offline, no server cost). Libraries load only when exporting.

## Scope
**In:** Reports page (owner only) · period presets + custom range ≤ 366 days (reuse History) · KPIs · by payment method · by sales mode · by hour · by day (range > 1 day) · top 10 products (qty / revenue) · by cashier · export CSV (Transaksi / Item / Refund), XLSX (5 sheets), PDF (summary) · download and native share (WhatsApp) where the browser supports file sharing.
**Out (YAGNI / later):** server-side export for huge ranges, scheduled email reports, profit/COGS (no cost data in MVP), comparisons vs previous period, multi-device data (needs sync pull, M15).

## Metric definitions (single source: `lib/reports.ts`)
| Metric | Definition |
| --- | --- |
| Gross sales | Σ `grandTotal` of orders with **sale** business date in range and status ∈ {paid, partial_refund, refunded} |
| Discounts | Σ item + order discounts of those orders |
| Refunds | Σ `amount` of refund records (kind = refund) whose **refund** business date is in range — regardless of sale date |
| Net sales | Gross − Refunds |
| Transactions | count of counted orders; Average = Gross / Transactions (rounded) |
| Voids | count and amount of void orders with sale date in range (excluded from gross; a void is same-day by rule) |
| By payment method | gross by the order's method; refunds attributed to the **original** method on the refund date |
| By hour | gross by hour of `paidAt` in store timezone |
| Top products | qty and line revenue (after item discount, before order-level discount) from counted orders |

## Architecture
```
Dexie ──useReportData(range)──► ReportInput {sales, refunds, refundOrders, members, store}
                                     │
                         lib/reports.ts buildReport()  (pure, tested)
                                     │  Report
              ┌──────────────────────┼─────────────────────────┐
         ReportsPage           lib/export/csv.ts      lib/export/xlsx.ts · pdf.ts (lazy import)
      (lazy route, charts)       (pure, tested)          (dynamic import of libs)
                                     └────► lib/export/deliver.ts (download / navigator.share)
```
- Refund records gain `businessDate` (computed at write time with store timezone + cut-off) so refunds can be queried by date; Dexie v3 index `[storeId+businessDate]`; Postgres migration adds `refunds.business_date` + backfill + index, and `daily_sales` view switches to the refund-date rule.
- Reports route is code-split (`React.lazy`) so the POS bundle does not grow.

## Exports
| Format | Content | Library |
| --- | --- | --- |
| CSV | one dataset per file: Transaksi, Item, or Refund; UTF-8 with BOM (Excel opens Indonesian text correctly); `;`-free, comma separated, RFC 4180 quoting | none |
| XLSX | sheets: Ringkasan, Transaksi, Item, Refund, Per Produk; Rupiah as numbers with `#,##0` format | `write-excel-file` (lazy) |
| PDF | A4 portrait summary: header, KPIs, payment methods, sales modes, top products, cashiers | `jspdf` + `jspdf-autotable` (lazy) |

File name: `kasirku-<store-slug>-<from>_<to>.<ext>` (+ `-transaksi` etc. for CSV).

## Error handling
- Invalid range → inline message (existing `validateRange`).
- Library load failure (offline before first export cached) → toast "Gagal memuat modul ekspor. Coba lagi saat online." (service worker caches the chunks after first use).
- Empty period → export still allowed (headers only) but UI shows an empty state.

## Security
- **Formula injection:** any text cell starting with `= + - @ \t \r` is prefixed with `'` in CSV and written as a string type in XLSX.
- Reports and export are owner-only (nav + page guard).

## Testing
- Unit: `buildReport` (refund-date attribution across days, voids excluded, method attribution, hour buckets in WIB, top products), CSV escaping + injection guard, XLSX generation read back with `read-excel-file`.
- e2e: sell → refund → open Reports → export CSV/XLSX/PDF → verify downloaded files (CSV rows, XLSX via openpyxl, PDF magic bytes).

## Self-review
No placeholders; metric definitions are unique and used by both Reports and History; scope fits one implementation plan; ambiguity resolved: "top products revenue" defined as line revenue before order-level discount.
