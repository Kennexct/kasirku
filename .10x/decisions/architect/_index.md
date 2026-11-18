# Architect — index

[DISCOVERED] Offline-first: UI reads/writes only Dexie; `saveAndQueue` writes record + outbox row in one IDB transaction; `pushOutbox` upserts by client UUIDv7 (idempotent).
[DISCOVERED] Orders append-only with immutability trigger server-side; refunds/voids are linked records + audit events.
[DISCOVERED] Pure domain logic in `src/lib/*` (pricing, refunds, dateRange, salesSummary) — unit tested; services in `src/services/*`; UI in `src/pages/*`.
[DISCOVERED] Business date = store timezone + day cut-off (`lib/businessDate.ts`).
[DISCOVERED] Known gap: sync is push-only (no pull to other devices yet — M15).

## Features
- reports-export — ADR-001, ADR-002 → `reports-export.md`
- staff-pin — ADR-003, ADR-004 → `staff-pin.md`
