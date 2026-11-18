# CTO — staff-pin

- **Build now, offline:** no backend dependency; closes the largest trust gap for owners with staff (PRD risk "cashier fraud via void/refund").
- **No new dependency:** WebCrypto PBKDF2 instead of bcrypt library (ADR-003).
- **Accepted limit:** client-side enforcement only until `owner-login`; stated in spec and UI copy stays factual (no "secure" claims).
- **Sequencing:** `staff-pin` → `owner-login` (needs a new Supabase project — user decision pending) → `sync-pull`.
