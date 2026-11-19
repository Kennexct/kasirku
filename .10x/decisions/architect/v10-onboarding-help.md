# Architect — v0.10 (first-time journey, help centre)

ADR-009. Spec: `specs/2026-11-19-v10-onboarding-help-design.md`.

| Unit | Kind | Notes |
| --- | --- | --- |
| `services/seedTemplate.ts` | data + builder | `TEMPLATES`, `buildSeedBundle(setup?)`; default setup = previous behaviour |
| `services/bootstrap.ts` | `findLocalStore`, `createLocalStore(setup)`, `ensureLocalStore` (tests, skip) | sets `meta.onboardedAt` |
| `hooks/useBootstrap.ts` | adds state `onboarding` + `completeOnboarding(setup)` | |
| `pages/Onboarding/` | full-screen journey outside the app shell | 3 steps |
| `lib/checklist.ts` + `hooks/useChecklist.ts` | pure rules + live facts | |
| `components/Checklist/` | banner (POS) + card (help page) | |
| `content/help.ts` | topics + intro cards, typed ids | |
| `pages/Help/HelpPage.tsx`, `components/Help/{HelpButton,HelpSheet,IntroCards}.tsx` | lazy route `/bantuan` | |

Failure modes: store creation fails midway → bootstrap sees a store without owner → existing error screen (seed order writes the store last to avoid it). Double submit → `createLocalStore` is de-duplicated like `ensureLocalStore`.
