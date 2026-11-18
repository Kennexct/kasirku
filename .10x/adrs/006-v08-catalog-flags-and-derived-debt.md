# ADR-006: Soft-deleted custom methods/modes, a manual sold-out flag, and debt derived from open orders

**Status:** Accepted · **Date:** 2026-11-19 · **Feature:** custom-methods-modes, sold-out, customer-debt · **Author:** 10x-Team

## Context
Three small features from the feedback round touch catalog configuration and customer data. Orders already snapshot method/mode names; open orders already represent unpaid sales.

## Decision
- Payment methods and sales modes are user-managed rows: create, rename, reorder (`sortOrder` renumbered 0..n), **soft delete** (`deletedAt`). History and reports rely on order snapshots, never on the live row.
- Sold-out is a boolean on the product (`isSoldOut`), toggled manually and synced like any product edit.
- "Who owes me" is **derived**: open orders grouped by `customerId`. No debt ledger entity, no partial payments.

## Alternatives Considered
| Alternative | Pros | Cons | Why Not |
| --- | --- | --- | --- |
| Hard-delete methods/modes | Clean tables | No delete policy on synced tables; breaks references held by open carts | Soft delete matches every other table |
| Stock quantities instead of a flag | Auto sold-out | Requires stock-in, adjustments, recipes — the inventory module the PRD excludes | A flag covers the daily "habis" case |
| Debt ledger with partial repayments | Real kasbon | New entity, payment allocation, statements; changes refunds/reports | Out of scope until sellers ask; open orders answer "who owes me" today |

## Consequences
Positive: no new entities or sync rules; one additive column (`products.is_sold_out`). Negative: sold-out must be cleared by hand until v0.9; debt can't be paid in parts. Risk: a deleted method still referenced by a persisted cart — POS already falls back to the default mode / first active method.
