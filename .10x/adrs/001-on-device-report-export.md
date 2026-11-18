# ADR-001: Generate report exports on the device with lazy-loaded libraries

**Status:** Accepted
**Date:** 2026-11-18
**Feature:** reports-export
**Author:** 10x-Team (Architect + Staff Engineer)

## Context
M13 requires CSV, XLSX and PDF exports for any date range ≤ 366 days. The app is an offline-first PWA used on low-end Android phones over 3G; the backend (Supabase) is not live yet and the cost target is ≤ Rp1.000 per merchant per month. The PRD originally sketched "server-side for ranges > 31 days". A street-food seller does ~50–300 orders/day → a full year is ≤ ~110k orders, but realistic early merchants export a week or a month (≤ 10k rows), well within browser memory.

## Decision
- Build all three formats in the browser from the same `Report` object the Reports page renders.
- CSV: hand-written, dependency-free serializer (RFC 4180 quoting, UTF-8 BOM, formula-injection guard).
- XLSX: `write-excel-file` (MIT, browser build), loaded with `import()` only when the user taps Export.
- PDF: `jspdf` + `jspdf-autotable` (MIT), loaded with `import()` on demand.
- Reports route itself is code-split with `React.lazy`; charts use `recharts` inside that chunk.
- Delivery: `navigator.share({ files })` when supported (WhatsApp/Drive on Android), otherwise an `<a download>` Blob URL.

## Alternatives Considered
| Alternative | Pros | Cons | Why Not |
| --- | --- | --- | --- |
| Server-side export (Supabase Edge Function) | Handles very large ranges; one implementation | Needs backend live + auth; costs per export; fails offline; data on device may not be synced yet | Backend not live; offline is a core requirement; defer until data proves the need |
| `exceljs` for XLSX | Full-featured (styles, formulas, read+write) | Last release 2023, Node-first (needs polyfills in Vite), ~22 MB unpacked, heavy chunk | Weight and maintenance risk for a write-only need |
| CSV only + browser "Print to PDF" | Smallest, no deps | No real .xlsx (amounts as text in some locales); PDF quality depends on device/browser | Fails "amounts summable in Excel" acceptance criterion |
| Bundle libs eagerly | Simpler code | +~250 KB gz on every POS load, violates 250 KB POS budget | Performance NFR |

## Consequences
### Positive
- Works offline; zero server cost; exports reflect exactly what the screen shows (same `Report`).
- POS bundle unaffected; export code downloaded once and cached by the service worker.
### Negative
- Very large ranges (≥ 100k rows) may be slow on low-end phones.
- Three formats to maintain; PDF uses standard fonts (no custom Plus Jakarta Sans embedding).
### Risks
- First export while offline before the chunk was ever cached → fails. Mitigation: clear toast; Workbox precaches all JS chunks (globPatterns include `**/*.js`), so after install it is available offline.
- Until M15 sync-pull, a device only reports its own sales. Mitigation: documented in UI copy and spec.

## Dependencies
- Depends on `lib/reports.ts` producing a complete `Report`.
- Constrains: future server-side export must emit the same columns (reuse column definitions in `lib/export/columns.ts`).
