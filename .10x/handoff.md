# Handoff

**From:** CTO + PM → **To:** Architect + Staff Engineer

- Approved spec: `.10x/specs/2026-11-18-reports-export-design.md` (metric definitions table is binding).
- Need ADRs for: (1) on-device, lazy-loaded export stack; (2) refund attribution by refund business date (requires `refunds.businessDate`).
- Reuse: `lib/dateRange.ts`, history date presets, `StatTile`-like tiles in `pages/History/HistorySummary.tsx`.
