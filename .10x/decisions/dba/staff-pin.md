# DBA — staff-pin

- `store_members.recovery_hash text` (nullable, additive); column comments document the `pbkdf2-sha256$…` format of `pin_hash`. Parses with pglast; not yet applied (no project).
- No Dexie schema bump: new fields are unindexed properties; lockout counters use existing `meta` rows (`pinlock:<memberId>`, `pinlock:recovery:<ownerId>`), device-local.
- `AppliedDiscount.approvedById` lives inside `orders.order_discount` JSONB — no migration.
- For `owner-login`/`sync-pull`: today any store member can `select` `pin_hash`/`recovery_hash` (row-level policy). Restrict with column privileges or a view before non-owner sessions exist.
