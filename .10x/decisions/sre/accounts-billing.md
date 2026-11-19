# accounts-billing — SRE
- Failure isolation: API down never stops selling for a valid pass; only first sign-in and payments need the server.
- Watch: Functions errors (`api_error` logs), Midtrans notification failures (dashboard), Resend bounces.
- Alert candidates: 5xx rate on /api/* > 2 % for 10 min; zero successful sign-ins for 24 h after launch.
- Manual fix paths in the runbook (grant days, key pair mismatch).
