# DevOps — staff-pin
- CI unchanged. Requires a secure context for `crypto.subtle` (HTTPS in preview/prod, localhost in dev) — already satisfied by Vercel.
- Deploy: additive migration `20261118020000` → preview from `feat/staff-pin` → merge after `feat/reports-export` (this branch is stacked on it).
- Rollback: Vercel instant rollback. PIN hashes written by this release stay in place; the previous release ignores them (it never checked PINs), so rollback re-opens owner screens — acceptable for a short rollback window.
- Follow-up unchanged: wire Python e2e into CI.
