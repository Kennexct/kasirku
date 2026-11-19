# accounts-billing — Security
Threats and controls
- Forged access: pass is ES256; only the public key ships. Tamper test in accessPass.test.ts.
- Code brute force: 6 digits, 10 min, 5 attempts then deleted; codes stored as SHA-256(email:code); constant-time compare.
- Email bombing / Resend cost: 60 s per email only → **add a Cloudflare rate-limit rule on /api/auth/code** (runbook step 5.6). Open item.
- Account enumeration: request-code answers the same for new and existing emails.
- Webhook spoofing: SHA-512 signature with server key + amount must equal the stored row; unknown orders ignored; double delivery applies once.
- Session theft: refresh token (random 256-bit, hashed at rest, 180 days, rotated on refresh) lives in localStorage — XSS would expose it. The app loads no third-party script except Google's GIS when enabled. CSP: open item.
- Clock rollback offline: monotonic "now"; worst case ≤3 days of grace abuse — accepted (ADR-013).
- DEV_MODE: memory DB and fake Midtrans need DEV_MODE=1 and a "dev-" key; production without DATABASE_URL/RESEND fails closed (missing_config).
- Secrets only in Cloudflare encrypted variables; .dev.vars git-ignored.
