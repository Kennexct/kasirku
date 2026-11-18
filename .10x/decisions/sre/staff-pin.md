# SRE — staff-pin
- Client-only; no new availability SLO. Signals to add with Sentry: PIN verify duration p95 (target < 300 ms on mid-range Android), count of `pin_locked` audit events per store per day (spike = guessing or a forgotten PIN), recovery-code resets.
- Support load to watch: "forgot PIN and lost code" — the only unrecoverable state; closes with `owner-login`.
- Runbook: `docs/runbooks/staff-pin.md`.
