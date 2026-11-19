# accounts-billing — Staff Engineer
- Server: no framework; handlers return `{status, body}`; all input validated by hand-written guards; JSON only.
- Money in integer Rupiah everywhere (Midtrans `gross_amount` integer).
- Times as epoch ms on the wire, `timestamptz` in Postgres.
- All new UI strings via `t()`; English entries added.
- Secrets only in Cloudflare env: `DATABASE_URL`, `RESEND_API_KEY`, `MAIL_FROM`, `PASS_PRIVATE_JWK`, `MIDTRANS_SERVER_KEY`, `MIDTRANS_PRODUCTION`, `GOOGLE_CLIENT_ID`, `APP_ORIGIN`.
