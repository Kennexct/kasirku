# Security Review — reports-export (M12–M13)

**Date:** 2026-11-18 · **Verdict:** PASS — no blocking findings

## Threat model (what changed)
New capability: business data leaves the device as files (CSV/XLSX/PDF) chosen by the owner. New code reads local data only; no new network endpoints; one SQL migration.

| Threat | Assessment | Control |
| --- | --- | --- |
| CSV/Excel formula injection via product name, label, note, reason (e.g. `=HYPERLINK(...)`, `@SUM`, `+cmd`) | Real: these fields are user-typed and opened in Excel/Sheets | `sanitizeText` prefixes `'` for leading `= + - @ TAB CR` in CSV; XLSX writes text as typed String cells **and** prefixes. Tested (`export.test.ts`). |
| XSS via labels/names in report UI, chart tooltips | Low | React escaping; no `dangerouslySetInnerHTML`/`innerHTML`/`eval` in `src` (scanned). PDF draws text, never HTML (`.html()` unused). |
| Unauthorised viewing (cashier) | Medium (known) | Nav hidden + page guard for non-owner. **Known limitation (since v0.1):** shared device runs as owner until M15; server data protected by RLS. |
| Data exfiltration by the app | None | No `fetch`/XHR/beacon in reports/export code (scanned). Files only created on explicit tap. |
| PII in exports | Low today | Exports contain cashier names, order labels (may describe a customer), payment references. No phone numbers (M7 not built). **Requirement for M7:** customer phone must not be exported by default (UU PDP 27/2022). |
| Supply chain | Low | New deps MIT (`write-excel-file`, `jspdf`, `jspdf-autotable`, `recharts`); `npm audit --omit=dev`: 0 vulnerabilities. jsPDF's optional `html2canvas`/`dompurify` chunks are bundled but only reachable via `.html()`, which we never call. |
| Filename/path injection | None | Store name slugged to `[a-z0-9-]`. |
| SQL / RLS | OK | Migration adds a column + index; existing refunds RLS policies cover it; `daily_sales` keeps `security_invoker = true`. |
| Blob URL leakage | OK | Object URLs revoked after 30 s. |

## Recommendations (non-blocking)
1. M15: server-verified owner session for Reports when sync pull lands.
2. M7: add "include customer phone" opt-in when customer export is added.
