# Senior Engineer — reports-export

- **T1:** `Refund.businessDate: BusinessDate`. `services/refunds.ts#commit` sets it from `getBusinessDate(ctx.now ?? new Date(), store)`. Dexie `version(3).stores({ refunds: 'id, storeId, orderId, [storeId+businessDate]' }).upgrade(tx => tx.table('refunds').toCollection().modify(r => { r.businessDate ??= r.createdAt.slice(0,10) }))`. Migration `20261118010000_refund_business_date.sql`.
- **T2:** `ReportInput = { store, range, sales: Order[], refunds: Refund[], ordersById: Map, memberName: Map }`. Sales = orders with sale date in range (all statuses except open). Pure; hour via cached `Intl.DateTimeFormat('en-GB',{hour:'2-digit',hourCycle:'h23',timeZone})`.
- **T3:** `useOrderHistory` adds refunds-by-date + their orders; History filters apply to a refund via its original order. `salesSummary.ts` delegates to `summarize()` exported from reports.
- **T5:** Spike: `await import('write-excel-file')` and `await import('jspdf')` in a Vite build; confirm separate chunks. CSV: `﻿` BOM, CRLF line endings, quote when `[",\r\n]`, double quotes escaped. `sanitizeCell(v)` = `/^[=+\-@\t\r]/.test(v) ? "'"+v : v`. Numbers stay numbers.
- **T6:** Charts: `BarChart` by hour (0–23, show 06–23 when empty early hours trimmed to first/last non-zero ±1), `BarChart` by day for range > 1. Tables reuse card/table styles from Products page.
- **Tricky parts:** negative/zero-sale periods (empty states); refunds for orders outside the range (need `bulkGet`); rounding stays integer.
