# accounts-billing — DBA
- Tables accounts, login_codes, refresh_tokens, payments (db/migrations/001_accounts_billing.sql). Emails stored lower-case (check constraint).
- Idempotent payment: `update … where status <> 'paid' returning` — one row means "apply once".
- Refresh rotation: `delete … returning` makes reuse impossible even under races.
- Indexes: refresh_tokens(account_id), payments(account_id, created_at desc).
- Housekeeping (later): cron to delete expired login_codes / refresh_tokens.
