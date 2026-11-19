# SDE — v0.12 (flexible price, sell by weight)

Built
- Types: `SaleUnit`, `Product.unit?`, `Product.isPriceEditable?`, `OrderItem.unit?`, `OrderItem.listPrice?`, `StoreRules.isWeightSaleEnabled?`.
- `lib/quantity.ts` (+tests): units, `parseQuantity` (comma or dot), `quantityForAmount`, `formatQuantity`, `formatLineQty`, `countUnits`, `hasPriceChange`, `perUnit`.
- `lib/pricing.ts`: `lineGross = round(unitPrice × qty)`.
- Cart: `addItem` accepts qty / unit / listPrice and keeps measured and flexible lines separate; `updateItem`; `repriceItems` keeps a hand-typed price.
- `pages/POS/components/SaleEntrySheet.tsx`: weight or money amount, quick buttons, price when flexible, live total; used to add and to edit a line. Cart lines show "0,75 kg × Rp40.000/kg", "harga diubah", and an edit button.
- Settings → Toko & Struk: "Jual per berat atau ukuran". Product form: "Dijual per" (when the setting is on), per-unit labels, "Harga bisa diubah saat jual".
- Receipt, WhatsApp text, history/open-order/customer lists, refund sheet (weighed line whole), best sellers, profit (cost × weight rounded per line), exports (Qty decimal, appended columns Satuan + Harga Normal; PDF shows weight with unit), history detail note "Harga diubah saat jual".
- Validation in `completeOrder` / `saveOpenOrder` (quantity > 0 and ≤ 9 999, price a whole non-negative number) and `saveProduct` (known unit).
- Migration `20261119020000_v12_unit_and_flexible_price.sql`. Help topic "timbang" in both languages. `e2e/v12.py`.

Deviations from the spec
- None in behaviour. The Reports screen has no tile for price differences (spec: out of scope); the evidence is in History and the Item export.

Tech debt
- Excel "Per Produk" sheet lists quantity as a number without its unit (the Item sheet has the unit).
- Editing a line that was entered by money amount and typing a new weight switches it to weight rounding (by design; total is shown before saving).
- No audit event for a price change; `listPrice` on the sale is the record.
- Turning the setting off does not convert products back to pieces.
- No scale integration, no tare, no custom units, no partial-weight refund.

## v0.12.1 — layout fix (user feedback, 19 Nov 2026)
Settings looked pushed to the left on wide screens (content capped at `max-w-2xl` and left-aligned, empty space on the right). `PageHeader` gained `isNarrow` and exports `NARROW_COLUMN` (`mx-auto w-full max-w-3xl`); Settings and Help now put the title, tabs and content in the same centred column. Other pages (lists, reports, Kas) keep the full width. No behaviour change.

## v0.12.2 — page overscroll fix (user feedback, 19 Nov 2026)
Symptom: on Settings (and any screen with switches) the whole page could scroll past the app, showing empty space under the nav rail.
Cause: `Switch` hides its checkbox with `sr-only` (position: absolute) but its label had no positioning, so the checkbox was placed relative to the page instead of the scrolling panel and stretched the document (Shop & Receipt: 1 475 px tall on a 768 px screen).
Fix: `relative` on the Switch label; the app shell is `overflow-hidden` and `main` is `relative`, so nothing inside can enlarge the page again; `overscroll-behavior: none` on `html` as well as `body`.
Check: document height equals the screen on all 13 app screens at 1900, 1024 and 390 px (script measures `scrollHeight` vs `innerHeight`); browser flows pass.
