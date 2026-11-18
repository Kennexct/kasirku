# Handoff

**From:** Orchestrator (Discovery) → **To:** Product Manager + Architect (Brainstorming `reports-export`)

- Codebase discovered and documented in `decisions/*/_index.md` (tagged [DISCOVERED]).
- Reuse: `lib/salesSummary.ts` (net/gross/refund definitions), `hooks/useOrderHistory.ts` (range query), `lib/dateRange.ts`, `HistoryFilters` date presets.
- Open question to user: should refunds count on the sale date or the refund date?
