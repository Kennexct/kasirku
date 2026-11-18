# QA — reports-export

- Strategy: pure-function unit tests for every metric + export format read-back; IndexedDB integration for refund dating; browser e2e with real downloads on two viewports; regression of all prior e2e flows; perf guard (20k orders).
- Quality gates met: 58/58 unit, 4/4 e2e, tsc clean, perf 207 ms.
- Bugs found/fixed: 5 (see `reviews/2026-11-18-qa-report.md`).
- Outstanding manual checks: Android share sheet, iOS PWA download.
