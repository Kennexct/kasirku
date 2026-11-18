# ADR-005: Customer data — name snapshot on orders, canonical phone, scrub on delete, no phone in exports

**Status:** Accepted
**Date:** 2026-11-18
**Feature:** customers
**Author:** 10x-Team (Architect + Security + DBA)

## Context
M7 introduces the first personal data of third parties (customer names and phone numbers). Orders are append-only snapshots; UU PDP 27/2022 expects purpose limitation and erasure on request; exports leave the device.

## Decision
- `Order.customerNameSnapshot` (nullable) is written when an order is saved; reads never join to `customers` for history.
- Phones are normalised to `+628…` before validation and storage; one active customer per phone per store.
- Deleting a customer sets `deletedAt` and removes `phone` and `note`; owner PIN required when owner mode is locked (ADR-004 rule).
- Report exports carry the customer name only. No dataset contains phone numbers.

## Alternatives Considered
| Alternative | Pros | Cons | Why Not |
| --- | --- | --- | --- |
| Join orders → customers at read time | No new column | History changes on rename; breaks on delete; extra lookups in exports | Violates the snapshot principle used everywhere else |
| Hard delete customer rows | Simplest erasure | Sync has no delete policy (append-only tables); dangling `customerId` | Soft delete + scrub achieves erasure of contact data within the existing model |
| Export phone numbers | Handy for marketing lists | Bulk PII leaves the device in a file; easy to leak | Out of scope; would need explicit opt-in |

## Consequences
Positive: stable history, minimal PII surface, constraint-compatible phones. Negative: a deleted customer's name remains on past receipts (documented); `+62`-only numbers (no foreign customers' phones). Risk: scrub is local until sync pushes the update — acceptable (same record, last-write-wins).
