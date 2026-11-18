# Engineering Manager — reports-export

Ordered tasks (each ≤ half a day). T1 → T2 → T3 are blocking; T4–T6 parallelisable after T2; T7 after T4–T6.

| # | Task | Est. | Depends | Risk |
| --- | --- | --- | --- | --- |
| T1 | Refund `businessDate`: type, Dexie v3 + upgrade, service write, Postgres migration (+view) | 1.5 h | — | Medium (schema) |
| T2 | `lib/reports.ts` buildReport + tests | 2 h | T1 | Medium (definitions) |
| T3 | History summary → refund-date rule via shared function; hook loads refunds by date | 1 h | T2 | Low |
| T4 | Extract `DateRangeControl` + `StatTile` to components/ui | 0.5 h | — | Low |
| T5 | Export: columns + CSV (+tests), XLSX (+read-back test), PDF, deliver | 3 h | T2 | Medium (lib bundling) |
| T6 | Reports page: lazy route, KPIs, charts, tables, owner guard, export sheet | 3 h | T2, T4, T5 | Medium (charts on phone) |
| T7 | e2e: reports + downloads; screenshots phone/tablet; bundle size check | 1 h | T6 | Low |

Total ≈ 12 h. Biggest unknowns: Vite bundling of `write-excel-file`/`jspdf` (spike inside T5 first), chart legibility at 390 px.
