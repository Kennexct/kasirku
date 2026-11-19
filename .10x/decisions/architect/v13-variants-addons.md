# Architect — v0.13 (variants, add-on rename)

ADR-012. Spec: `specs/2026-11-19-v13-variants-addons-design.md`.

| Unit | Change |
| --- | --- |
| `types` | `ProductVariant`, `Product.variants?`, `OrderItem.variantId?/variantName?` |
| `lib/productVariants.ts` (new, pure) | `activeVariants`, `priceTarget`, `variantPrice`, `isProductSoldOut`, `lineName`, `fromPrice`, `validateVariants` |
| `pages/POS/components/VariantSheet.tsx` → `OptionSheet` | variant section + add-on groups |
| `POSPage` | route to sheet when variants or add-ons; carry variant into entry sheet; reprice by variant |
| cart store | merge key includes `variantId` |
| `ProductForm` + `ProductVariantsEditor` | variant rows (name, price, per-mode prices, cost) |
| `ProductsPage` | tab "Add-on", list shows variants count |
| `services/catalog` | `saveProduct` validates variants, sets basePrice; `setVariantSoldOut` |
| `services/dayClosing.resetSoldOut` | also variants |
| `SoldOutSheet` | nested variant switches |
| `lib/reports` | key by product + variant |
| `seedTemplate` | kopi template with variants + add-ons |
| migration, help, README, PRD, runbook | |
