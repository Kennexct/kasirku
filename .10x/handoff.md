# Handoff

**From:** Architect + Staff Engineer → **To:** Engineering Manager + Senior Engineer

- ADR-001 (on-device export) and ADR-002 (refund business date) accepted — see `.10x/adrs/`.
- Component table in `decisions/architect/reports-export.md`; rules in `decisions/staff-engineer/reports-export.md`.
- Sequencing hint: data change (refund businessDate + migrations) first, then `buildReport`, then History alignment, then exporters, then UI.
