# Customers — Design (M7)

**Date:** 2026-11-18 · **Slug:** `customers` · **Size:** medium · **Status:** User instructed "build customer first"; scope = PRD M7. Team decisions below were stated to the user at start.

## Scope
**In:** customer list with search (name / phone), add / edit / delete; attach a customer to a cart (pick or quick-add at the POS); customer name on orders, receipts, open orders, history and transaction exports; WhatsApp receipt straight to the customer's number; per-customer stats (visits, total spend, last visit, open orders) and recent orders.
**Out:** loyalty points, kasbon/debt ledger, customer segments, bulk import, customer export with phone numbers, marketing broadcasts.

## Decisions
1. Phone optional; accepted as `08…`, `628…`, `+628…`, with spaces/dashes; stored canonically as `+628…` (matches the existing SQL check); unique among a store's active customers.
2. Orders snapshot the customer's name (`customerNameSnapshot`) like every other order field — history survives rename/delete.
3. Delete = soft delete **plus scrub** of phone and note (UU PDP 27/2022 "erase on request"); the name stays on past receipts as part of the transaction record. Needs the owner PIN when owner mode is locked.
4. Exports include the customer **name** only; phone numbers are never exported.
5. Customers screen is open to cashiers (PRD screen map); list renders at most 100 matches.

## Acceptance
- Search over 5 000 customers < 300 ms (pure filter, perf-tested).
- A sale with a customer shows the name on receipt/history and increments visits/total.
- Receipt WhatsApp link targets `wa.me/62…` when the customer has a phone.
