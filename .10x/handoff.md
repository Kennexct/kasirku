# Handoff

**To:** Product Manager / user

The feedback round is complete: v0.8 (custom methods & modes, sold-out, unpaid customers), v0.9 (profit, expenses, close of day, backup), v0.10 (first-time journey, help centre), v0.11 (English). Reviews: `reviews/2026-11-19-v0{8,9}-review.md`, `v10-review.md`, `v11-review.md`.

Nothing is merged to `main`; branches are stacked (`main` → reports-export → staff-pin → customers → v0.8-feedback → v0.9 → v0.10 → v0.11).

Open decisions for the user
1. Create a Supabase project (needed for owner login and sync between devices; six migrations are ready and unapplied).
2. Merge order / pull requests for the stacked branches.
3. WhatsApp support number for a contact button in help.
4. Should the register return to the default sales mode after each sale?

Manual device checks still open: see `status.md` → "Open before GA".
