# Architect — v0.12 (flexible price, sell by weight)

ADR-011. Spec: `specs/2026-11-19-v12-flex-price-weight-design.md`.

| Unit | Change |
| --- | --- |
| `types` | `SaleUnit`; `Product.unit?`, `Product.isPriceEditable?`; `OrderItem.unit?`, `OrderItem.listPrice?`; `StoreRules.isWeightSaleEnabled` |
| `lib/quantity.ts` (new, pure) | units table, `isMeasured`, `parseQuantity`, `roundQuantity`, `quantityForAmount`, `formatQuantity`, `formatLineQty`, `countUnits`, quick amounts |
| `lib/pricing.ts` | `lineGross` rounds |
| `store/useCartStore.ts` | `addItem` takes qty/unit/listPrice, no merge for measured/flexible; `updateItem`; `repriceItems` returns price + list price |
| `pages/POS/components/SaleEntrySheet.tsx` (new) | weight / amount / price entry, add + edit |
| `POSPage`, `CartPanel` | route taps to the sheet; cart line shows quantity text + "Ubah" |
| `ReceiptView`, `receiptText`, history/open-order/customer lists | use `formatLineQty` + `lineGross` |
| `RefundSheet` | measured line: all-or-nothing |
| `lib/reports.ts`, `lib/profit.ts`, `lib/export/*` | `countUnits`, unit on product rows, decimal qty column, Satuan + Harga Normal columns |
| `ProductForm`, `ProductsPage`, `StoreSettings` | switch, unit chips, per-unit labels, setting |
| migration | `products.unit`, `products.is_price_editable`, `order_lines` view qty numeric |
| help, README, PRD, runbook | new topic "Jual per berat dan harga bebas" |

Failure modes: quantity 0 or not a number → refused in the sheet and in `completeOrder`; price × qty overflow → quantity capped at 9 999; old clients reading new orders → unknown fields ignored, but integer-qty assumptions would misprint weights (single-device today).
