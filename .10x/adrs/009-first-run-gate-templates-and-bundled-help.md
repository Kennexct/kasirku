# ADR-009: First-run gate, data-defined templates, derived checklist, bundled help

**Status:** Accepted
**Date:** 2026-11-19
**Feature:** v10-onboarding-help
**Author:** 10x-Team (Architect + Staff Engineer + PM)

## Context
Until now the app silently seeded one fixed menu on first launch. v0.10 adds a short journey, more starting menus, a getting-started checklist and help. The app is offline-first and has no server; a device may also arrive with data through a backup restore (ADR-008).

## Decision
- **Gate on "no store on this device".** Bootstrap looks for a store; none → the journey is shown *instead of* the app, and the store is created only when the merchant finishes or skips. No flag is needed to decide whether onboarding ran: the store's existence is the fact.
- **Templates are data** (`services/seedTemplate.ts`): one builder turns a template definition + the merchant's choices into the seed bundle. Adding a business type = adding rows.
- **The checklist is derived, not stored.** Each item is a pure function of facts already in the database (orders exist, owner PIN set, a closing exists, last backup time…). Only two device-local `meta` keys exist: `onboardedAt` (new installs get the banner; older devices do not) and `checklistDismissed`.
- **Help content is typed data bundled with the app** (`content/help.ts`), rendered by one page and one sheet. Topic ids are a union type, so a "?" button cannot point to a topic that does not exist.

## Alternatives Considered
| Alternative | Pros | Cons | Why Not |
|-------------|------|------|---------|
| Seed first, then show a tour over the live app | Merchant sees the real UI | Wrong menu already created; needs element-highlighting machinery | More code, worse first impression |
| Stored checklist progress (tick boxes) | Simple model | Drifts from reality; restores and second devices show wrong state | Derived state cannot be wrong |
| Help on a website | Easy to update | Useless offline, needs hosting | Sellers are often offline |
| Markdown files + renderer | Familiar authoring | Parser dependency in the bundle; no type-checked links | 15 short topics do not justify it |

## Consequences
### Positive
- Works with backup restore and future sync-pull without special cases.
- Help and checklist cost no network and no new dependency.
### Negative
- Help text changes need an app release.
- Help adds text to the main bundle (lazy-loaded page keeps it out of the cashier screen's first load).
### Risks
- Templates could reference missing categories/variants → covered by a unit test over every template.

## Dependencies
- ADR-008 (restore), ADR-003/004 (owner PIN fact). v0.11 adds the language step and an English copy of the content.
