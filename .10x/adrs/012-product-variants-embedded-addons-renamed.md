# ADR-012: Variants embedded in the product; variant groups become "add-ons" in name only

**Status:** Accepted
**Date:** 2026-11-19
**Feature:** v13-variants-addons
**Author:** 10x-Team (Architect + Staff Engineer + DBA)

## Context
`VariantGroup` (options with a price delta) is really a modifier/add-on. Merchants also need true variants: same product family, different item and full price (Latte vs Espresso). Orders are snapshots; reports group lines by product; prices resolve per sales mode (`resolveModePrice`).

## Decision
- **Rename only at the surface.** Type, table and field names `VariantGroup` / `variantGroups` / `variantGroupIds` stay (no data migration, no sync/backup change); every user-facing word becomes "Add-on". A code comment marks the mapping.
- **Variants live inside the product** as `Product.variants?: ProductVariant[]` (`id, name, price, modePrices?, costPrice?, isSoldOut?, sortOrder`). They are edited, synced and backed up with the product.
- **Pricing reuses the product rule:** a variant is priced by calling `resolveModePrice` on the product with `basePrice`/`modePrices` replaced by the variant's (`priceTarget(product, variant)`), so Dine In / per-product / markup rules apply unchanged.
- **Order line:** `nameSnapshot` = "Product – Variant", plus `variantId` and `variantName`. Everything that prints a name keeps working; reports key lines by `productId + variantId`.
- `Product.basePrice` mirrors the cheapest variant so lists, tiles and older code paths have a sensible price.
- Sold-out: `variant.isSoldOut`; a product is unsellable when it is sold out itself or all its variants are.

## Alternatives Considered
| Alternative | Pros | Cons | Why Not |
|-------------|------|------|---------|
| Each variant a separate product + "group" field | No new nesting | Add-ons, photo, category duplicated per variant; the cashier grid gets 4× longer | Contradicts the merchant's model |
| Variants as a separate synced table | Normalised | Another table, sync/backup/RLS changes, joins everywhere | Variants are never used without their product |
| Rename types/tables to Addon | Code matches words | Migration of local data, backups, sync tables and server schema for no behaviour change | Cost without benefit; a comment covers it |
| Variant price as a delta (like add-ons) | One mechanism | User chose full prices; deltas make per-mode prices awkward | User decision |

## Consequences
### Positive
- No migration of existing data; products without variants untouched.
- Price rules, flexible price and sell-by-weight work for variants with no extra branches beyond `priceTarget`.
### Negative
- Code says "variantGroup" where the UI says "add-on".
- Product rows grow (variants in JSON); fine at expected sizes (≤ 20 variants).
### Risks
- Reports/exports that key by product would merge variants → keyed by `productId + variantId`, unit-tested.

## Dependencies
ADR-006 (sold-out), ADR-007 (cost snapshot), ADR-011 (unit, flexible price).
