# accounts-billing — CTO
- Build, not buy: auth is small (email code + optional Google); a hosted auth vendor adds cost and a second data store.
- Stack set by the user: Cloudflare Pages + Functions, Neon, Resend, R2 (later), GitHub. Supabase dropped; the dormant Supabase client and migrations stay until sync is redesigned on Neon.
- Revenue model: 14-day trial → Rp49.000/month or Rp490.000/year (placeholders until the user confirms).
- Risk accepted: offline grace can be gamed for ≤3 days.
