# v0.13 — real variants, and today's "Varian" renamed to Add-on

**Date:** 2026-11-19 · **Status:** Approved by the user (design message + answers: "Own full price", "Build + PRD + docs") · **ADR:** 012

## Why
The merchant's model: **product → variant → add-on**. *Kopi* has variants *Latte, Americano, Cappuccino, Espresso*, each its own drink at its own price; add-ons tweak any of them (*less ice / normal ice*, *no sugar / less sugar / normal sugar*, *tall / grande / venti*). What the app called "Varian" until now are add-ons.

## Scope
1. **Rename** the existing feature to **Add-on** everywhere (UI, help, docs). Behaviour and stored data unchanged (groups, required/optional, single/multi, extra price).
2. **Variants** on a product: list of variants, each with **its own full price**, own price per "per product" sales mode (e.g. Takeaway), own cost price, own "Habis" switch, order. A product without variants behaves exactly as before.
3. **Cashier:** tapping a product with variants opens one sheet: variant first (required, single choice; sold-out variants disabled), then the product's add-ons. The sheet shows the running price.
4. **Records:** a sold line is named "Kopi – Latte" and stores `variantId`/`variantName`; receipt, history, exports read naturally. Reports and best sellers count per variant.
5. **Sold out:** the cashier's sold-out list shows variants under their product; the product tile shows Habis only when every variant is sold out. Closing the day resets variant flags too.
6. Variants inherit the product's unit (sell by weight) and flexible-price switch (v0.12).
7. Coffee starter template rebuilt with variants + add-ons as the example.

## Rules
- A product's displayed price ("mulai Rp…") is its cheapest active variant; `basePrice` is kept equal to that on save.
- At least one variant when the variant section is used; variant names unique within the product (case-insensitive), 1–40 chars; max 20 variants.
- Deleting a variant does not change past sales (snapshot names).
- Cart lines merge only when product, variant and add-ons are identical.

## Out of scope
Nested variants / variant matrix, stock count per variant, barcodes per variant, add-ons that differ per variant.

## Success criteria
- Sell Kopi – Latte (Rp25.000) + Grande (+Rp4.000) + Less ice → Rp29.000; Takeaway price per variant applies; receipt "Kopi – Latte · Grande, Less ice" — unit + browser tested.
- Best sellers list Kopi – Latte and Kopi – Americano separately.
- All existing tests and browser flows pass with the rename.
