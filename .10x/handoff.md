# Handoff

**From:** DevOps + SRE → **To:** next sub-project (`owner-login`)

- `staff-pin` delivered on `feat/staff-pin` (stacked on `feat/reports-export`; neither merged to `main`).
- Next needs a user decision: create a Supabase project for KasirKu (none exists; two unrelated projects must not be touched).
- Carry-overs for `owner-login`: server-side PIN/account check for void/refund, restrict `pin_hash`/`recovery_hash` columns, account-based owner PIN reset, queue store settings for sync.
- Runbooks: `docs/runbooks/`. Reviews: `.10x/reviews/2026-11-18-staff-pin-*.md`.
