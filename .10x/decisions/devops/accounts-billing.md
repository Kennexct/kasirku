# accounts-billing — DevOps
- Cloudflare Pages from GitHub, build `npm run build` (app + server typecheck + vite), output dist, functions/ auto-deployed.
- Preview deployments per branch: use Midtrans sandbox + a separate Neon branch.
- Rollback: Pages → Deployments → "Rollback to this deployment". DB migration is additive only.
- Runbook: docs/runbooks/deploy-cloudflare.md. Env template: .env.example.
