# Security — reports-export

- Formula-injection guard in the shared column layer (CSV + XLSX), tested.
- No new network surface; no HTML rendering into PDF; deps MIT, audit clean.
- Known limitation carried: owner-only enforced client-side until M15.
- Full review: `reviews/2026-11-18-security-review.md`. Verdict PASS.
