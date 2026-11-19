# accounts-billing — Architect (see ADR-013)
Components
- `server/` pure handlers: auth (request code, verify code, google, refresh, sign out), billing (checkout, notification, status, history). `server/repo.ts` interface + `neonRepo` + `memoryRepo`.
- `functions/api/[[path]].ts` router → handlers; `functions/_env.ts` builds Deps from env.
- Client: `src/services/account.ts` (tokens + API), `src/lib/accessPass.ts` (verify + state, pure), `src/store/useAccessStore.ts`, `src/pages/Auth/SignInPage.tsx`, `src/pages/Settings/SubscriptionSection.tsx`, `SubscriptionBanner`.
Data flow: sign in → {pass, refreshToken} in localStorage → boot verifies pass → refresh in background.
Failure modes: API down → existing pass keeps working; no pass + offline → sign-in screen explains internet is needed once.
