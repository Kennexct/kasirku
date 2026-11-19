# SDE — v0.13 (variants, add-on rename)

Built
- Types: `ProductVariant`, `Product.variants?`, `OrderItem.variantId?/variantName?`; add-on types keep their names with ADR-012 comments.
- `lib/productVariants.ts` (+tests): `priceTarget`, `variantPrice`, `fromPrice`, `isProductSoldOut`, `lineName`, `validateVariants`.
- Cashier: `OptionSheet` (was `VariantSheet`) — variant first (sold-out disabled, single variant preselected), then add-ons, running price; tiles show "Mulai Rp…"; cart merge key includes the variant; re-pricing by sales mode uses the variant's price.
- Sold out: per-variant switches nested under the product; product unsellable only when all variants are; closing resets variant flags.
- Products: "Punya varian" switch + `ProductVariantsEditor` (name, price, per-mode price, cost, order, delete); tab and labels renamed to Add-on; list shows variants and add-ons.
- `saveProduct` validates variants and sets `basePrice` to the cheapest; `setVariantSoldOut`.
- Reports key rows by product + variant; Item export: column "Varian" (options) renamed "Add-on", new appended column "Varian" (variant name).
- Coffee template rebuilt: Kopi (5 variants), Teh (3), Cokelat, Roti Bakar, Kentang Goreng; add-ons Es / Gula / Ukuran (Tall, Grande +4.000, Venti +7.000).
- Migration `20261119030000_v13_product_variants.sql`; help topic rewritten in both languages; `e2e/v13.py`; v10/v11 flows updated to the new menu.

Deviations
- Item export: the existing "Varian" column now holds add-ons under the header "Add-on" (same position); the variant name is appended at the end so no column moves.
- On phones the product list shows "· 2 varian" (count) instead of variant names (names are in the wide-screen column).

Tech debt
- Code identifiers still say `variantGroup` for add-ons (deliberate, ADR-012).
- Add-ons apply to all variants of a product; no per-variant add-ons.
- Variant photos, barcodes and stock counts not supported.
