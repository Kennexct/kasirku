# Handoff

**From:** Orchestrator → **To:** PM + Architect (Brainstorming M15)

- M15 is too large for one spec; proposed split: `staff-pin` → `owner-login` → `sync-pull` (see status.md).
- Recommendation given to user: `staff-pin` first (no backend dependency, fully testable now).
- Backend fact: no KasirKu Supabase project exists; creating one is the user's decision (cost) and is needed before `owner-login`.
- Existing hooks for `staff-pin`: `StoreMember.pinHash`, `lib/permissions.ts` (`needs_owner_pin`), `useSessionStore.signInCashier`, `useBootstrap` auto sign-in (TODO M15), `DiscountSheet` cashier limit.
- New work branches from `feat/reports-export` (still unmerged; `main` untouched).
