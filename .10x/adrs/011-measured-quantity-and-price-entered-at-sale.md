# ADR-011: Decimal quantity for measured products and a price entered at sale

**Status:** Accepted
**Date:** 2026-11-19
**Feature:** v12-flex-price-weight
**Author:** 10x-Team (Architect + Staff Engineer + DBA)

## Context
Until now a sold item is `unitPrice × qty` with an integer quantity and a price that always comes from the product and sales mode. Market sellers need a quantity that is a weight and a price typed at the counter. Orders are append-only snapshots; money is integer Rupiah; one function (`lineGross`) defines a line's value and everything else (discounts, totals, refunds, reports, exports) builds on it.

## Decision
- **Quantity may be a decimal** for products with a unit other than `pcs`. `OrderItem.unit?` records the unit (absent = pieces). No second "weight" field: one quantity, one formula.
- **`lineGross = Math.round(unitPrice × qty)`** — unchanged for integer quantities, whole Rupiah for decimals. All other money maths already goes through it.
- Weight typed by the seller is rounded to 3 decimals. When the seller types a **money amount**, quantity = amount ÷ price kept at full precision, so the rounded line total is exactly the amount; quantity is *displayed* with 3 decimals.
- **Flexible price:** `Product.isPriceEditable?`. A sold item of such a product carries `listPrice` (the normal unit price at that time, including options); `unitPrice` is what was charged. A difference between the two is the record of a price change. No approval step (user decision).
- Measured and flexible-price items never merge into an existing cart line; they are edited through the entry sheet. Sales-mode re-pricing keeps a hand-typed price.
- The feature switch for units lives in store settings (`StoreRules.isWeightSaleEnabled`), shown only in the product form; the cashier reads the product, not the switch.
- "Items sold" counts a measured line as 1 (`countUnits`), so 0,75 kg does not become "0,75 item".
- Refund selection for a measured line is all-or-nothing (the sheet offers the remaining quantity as one step); the refund maths itself is quantity-proportional and needs no change.

## Alternatives Considered
| Alternative | Pros | Cons | Why Not |
|-------------|------|------|---------|
| Integer quantity in grams (price per gram) | No decimals anywhere | Prices per kg must be stored per gram (fractions of a Rupiah) or converted everywhere; ugly for liter/meter/ons | Moves the rounding problem into prices |
| Separate `weight` field with qty fixed at 1 | Integer qty stays | Two formulas for a line's value; every consumer must know which applies | `lineGross` stops being the single definition |
| Store a fixed `lineAmount` on the item for "buy by amount" | Exact by construction | A third value that can disagree with price × qty; refunds and discounts need special cases | Full-precision quantity gives the same exactness with no new field |
| Flexible price as an ad-hoc discount/markup | Reuses discounts | A higher price is not a discount; reports would misstate discounts | Different concept |
| Owner-PIN approval for price changes | Control | Slows the exact sellers this is for | User chose "any seller"; `listPrice` keeps the evidence |

## Consequences
### Positive
- One formula, one quantity; receipts, refunds, profit and exports work for pieces and weights alike.
- Existing data needs no migration (absent fields mean pieces and fixed price).
### Negative
- Quantities are floating-point numbers in storage; sums are formatted to 3 decimals for display.
- The server view `order_lines` cast quantity to `int`; a migration recasts to `numeric`.
- A cashier can undercharge on flexible products; only the record (`listPrice`) deters it.
### Risks
- Rounding surprises (price × weight) → covered by unit tests on typical market prices and by showing the line total before adding.
- Decimal entry differs by locale (0,75 vs 0.75) → the parser accepts both.

## Dependencies
- ADR-007 (cost × quantity for profit, now rounded per line), ADR-010 (new strings need English).
