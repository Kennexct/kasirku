# v0.12 — flexible price per product and selling by weight

**Date:** 2026-11-19 · **Status:** Approved by the user (design message + two answers: "Build + PRD + docs", "Any seller") · **ADR:** 011

## Why
Traditional-market sellers price by weight and their prices move every day; a fixed price per piece cannot record their sales. Other sellers have a few items whose price is agreed at the counter.

## 1. Flexible price ("Harga bisa diubah saat jual")
- A switch on the product. The base price stays the normal price.
- At the cashier, tapping the product opens an entry box with the normal price prefilled; the seller types the price charged. The price can be changed again from the cart line.
- **Any seller** may change it (the owner decided which products are flexible). Price must be ≥ 0.
- The sold item records the price charged **and** the normal price at that moment. History shows "harga normal" next to a changed price; the Item export has a "Harga Normal" column.
- Switching the sales mode keeps a hand-typed price and only refreshes the normal price.

## 2. Selling by weight or measure
- Pengaturan → Toko & Struk → "Jual per berat atau ukuran" (off by default). On → the product form shows "Dijual per".
- Units: pcs (default), kg, ons, gram, liter, meter. The base price, mode prices and cost price are per that unit.
- At the cashier, a measured product opens the entry box: type the **weight** (comma or dot, up to 3 decimals) **or** the **money amount** (the weight is calculated and the line total equals the amount exactly). Quick buttons per unit (kg/l/m: ¼ ½ 1 · ons: 1 2 5 · gram: 100 250 500).
- Each entry is its own cart line; the line is edited through the same box (no +/− stepper).
- Line total = price × quantity, rounded to whole Rupiah.
- Receipt, WhatsApp text, history and exports show "0,75 kg × Rp40.000".
- Counting: a measured line counts as one item in "item terjual"; best sellers show the summed weight with its unit.
- Refund: a measured line is refunded whole.
- A product can be measured and flexible-price at the same time. Variants still work (chosen first, then the entry box).
- Turning the setting off hides the field but does not change products already set to a unit.

## Out of scope
Digital scale connection, barcode labels with embedded weight, tare, custom unit names, partial-weight refunds, a report tile for price differences, price change limits or approval.

## Success criteria
- 0,75 kg × Rp40.000 = Rp30.000; "Rp10.000" of a Rp30.000/kg item charges exactly Rp10.000 and shows 0,333 kg — unit-tested.
- Totals, discounts, tax, refunds, profit and exports stay correct with decimal quantities — unit-tested; all existing flows pass.
- A market-seller flow (enable setting → product per kg with flexible price → sell by weight, by amount, at a changed price → receipt → refund) passes in the browser on tablet and phone.
