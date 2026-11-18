# CTO — reports-export

- **Build, not buy.** Reports are derived from data we already hold; no third-party BI fits an offline PWA for micro-sellers.
- **On-device export** (user choice A): zero marginal server cost, works offline, matches the ≤ Rp1.000/merchant/month cost target. Server-side export deferred until real merchants hit ranges/data volumes the device can't handle.
- **Library choice:** `write-excel-file` (MIT, browser-first, maintained) instead of `exceljs` (last release 2023, Node-oriented, ~22 MB unpacked). `jspdf` + `jspdf-autotable` (MIT) for PDF. `recharts` (MIT) for charts. All lazy-loaded.
- **Accounting stance:** cash basis — refunds hit the day they happen (user choice A). Simple for UMKM; matches the drawer.
