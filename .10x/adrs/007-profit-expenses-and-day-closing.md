# ADR-007: Cost snapshots, expenses and day closings

**Status:** Accepted
**Date:** 2026-11-19
**Feature:** v09-profit-closing
**Author:** 10x-Team (Architect + Staff Engineer + DBA)

## Context
Sellers want profit and a cash check at night. Orders are append-only snapshots; reports have one metric definition (`lib/reports.ts`) on a cash basis (ADR-002). The device is the only source of truth for now (push-only sync). Most sellers will never enter cost prices, some will; many buy ingredients daily from the drawer.

## Decision
1. **Cost is a snapshot on the sold item.** `Product.costPrice?` (optional). `OrderItem.unitCost?` is copied when the item enters the cart. Reports read only the snapshot, so changing a cost price never rewrites past profit.
2. **Expenses are their own synced table** (`expenses`): business date, category (fixed list), amount, note, `isFromDrawer`, actor. Soft delete. No edit.
3. **Profit is computed by one pure module** (`lib/profit.ts`) with two automatic modes: *cost mode* (gross = sales − tax − HPP; net = gross − operating expenses; ingredient purchases excluded to avoid counting them twice) and *simple mode* (sales − tax − all expenses) when no sold item has a cost.
4. **A day closing is an immutable record** (`dayClosings`): the drawer figures as computed at closing time plus the counted cash. One live closing per store + business date. Reopen = soft delete + audit event; closing again writes a new record.
5. **Drawer maths is a pure function** (`lib/cashDrawer.ts`) used by the live screen and by the closing service, so the screen and the stored record cannot disagree.
6. Opening cash before closing is device-local (`meta`), not a synced record.

## Alternatives Considered
| Alternative | Pros | Cons | Why Not |
|-------------|------|------|---------|
| Compute profit from the product's current cost | No schema change on items | Past profit changes whenever a cost is edited | Breaks the append-only rule that reports rely on |
| Subtract all expenses from gross profit | One simple formula | Double-counts ingredients for sellers who use cost prices | Gives a wrong, pessimistic number to exactly the careful sellers |
| Force sellers to pick a "profit method" in settings | Explicit | One more setting to understand; wrong choice = wrong numbers | The data already tells us which mode applies |
| Cash session ("buka kasir" / "tutup kasir" shifts) | Supports several shifts per day | Blocks selling until someone opens a shift; more states | Too heavy for a one-person stall; can be added later on the same table |
| Editable closings | Fix typos | The record stops being evidence | Reopen + close again keeps an audit trail |

## Consequences
### Positive
- Profit and drawer numbers are reproducible from stored records and unit-testable without a browser.
- No new required step in the selling flow.
### Negative
- Options (extra toppings) have no cost, so profit is slightly overstated for products with paid add-ons.
- Refunded items keep their cost; refunded tax is still deducted from the sales basis (slightly conservative).
- A sold item without a cost counts as cost 0 — mitigated by an on-screen warning.
### Risks
- Sellers may record ingredient purchases *and* expect them subtracted in cost mode → the profit card states the rule in one line.
- Drawer figures cover this device's sales only until sync-pull exists → stated on the screen, as in Reports.

## Dependencies
- ADR-002 (cash basis), ADR-004 (owner approval), ADR-006 (sold-out flag reset at closing).
- Constrains: a future shift feature must extend `dayClosings`, not replace it.
