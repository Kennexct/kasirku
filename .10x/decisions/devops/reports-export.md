# DevOps — reports-export

- **CI:** unchanged pipeline (`npm ci → typecheck → test → build`). Perf test reads `CI` (set by GitHub Actions) → 1 500 ms budget on shared runners.
- **Build:** Reports route + exporters are separate chunks (main 157 KB gz unchanged within budget); Workbox `globPatterns` includes `**/*.js`, so lazy chunks are precached → export works offline after install.
- **Deploy order:** (1) apply DB migration `20261118010000` to staging, (2) Vercel preview from `feat/reports-export`, (3) manual Android share + iOS download checks, (4) merge to `main` → prod; (5) migration to prod via manual approval.
- **Rollback:** frontend — Vercel instant rollback to previous deployment. DB — roll forward preferred; down script in `docs/runbooks/reports-export.md` (only before clients sync `business_date`).
- **Follow-up:** run Python e2e suites in CI (needs Chrome + playwright + openpyxl job) — not yet wired.
