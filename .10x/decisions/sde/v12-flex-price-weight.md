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
