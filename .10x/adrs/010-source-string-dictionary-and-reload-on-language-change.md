# ADR-010: Indonesian source strings as typed keys, English dictionary, reload on language change

**Status:** Accepted
**Date:** 2026-11-19
**Feature:** v11-english
**Author:** 10x-Team (Architect + Staff Engineer)

## Context
About 800 interface strings live in ~90 files: JSX text, attributes, toasts, errors thrown by services, module-level label maps, date formatters created once per module, plain-text builders (receipt, closing summary, reminder), export headers. Unit tests assert the Indonesian wording. The app is small, offline, and has no i18n dependency.

## Decision
- **`t('Teks Indonesia', ...args)`**: the Indonesian sentence in the code is the key. `src/i18n/en.ts` maps every key to English. `Msg = keyof typeof EN`, so calling `t()` with a sentence that has no English entry **does not compile**.
- Placeholders are positional (`{0}`, `{1}`) so word order can differ. English values may use `{0|singular|plural}`.
- **Language is read once at startup** (localStorage → device language → Indonesian) and exported as a constant. Changing it saves the choice and **reloads the app**. Module-level label maps and `Intl` formatters therefore stay simple and correct.
- Dates use `DATE_LOCALE` (`id-ID` / `en-GB`); Rupiah formatting is not language-dependent.
- Long-form help content is not in the dictionary: one typed file per language (`content/help.id.ts`, `content/help.en.ts`).
- A one-off codemod (`scripts/i18n-wrap.mjs`, TypeScript compiler API) wrapped the existing strings; `scripts/i18n-scan.mjs` lists literals that still look like interface text.

## Alternatives Considered
| Alternative | Pros | Cons | Why Not |
|-------------|------|------|---------|
| Key-based catalog (`t('pos.pay')`) with i18next/react-intl | Industry standard, plural rules, lazy loading | Every string site rewritten twice (key + two catalogs); unit tests lose readable wording; +15–40 KB | Cost far above benefit for two languages |
| React context + re-render on change (no reload) | Instant switch | Module-level labels and formatters go stale unless all are refactored into hooks | Reload is one second, once |
| English as the source language | Conventional | Flips 800 strings and every test assertion | Indonesian is the primary audience and the tested wording |
| Translate at build time (two bundles) | Zero runtime cost | Two deployments, language tied to URL | Per-device switch is a requirement |

## Consequences
### Positive
- Indonesian behaviour is byte-identical (key = text), so the existing tests keep guarding it.
- Completeness is enforced by the compiler; no runtime "missing key" state exists.
### Negative
- Editing an Indonesian sentence means editing its key in `en.ts` too (the compiler points at it).
- The English dictionary ships to everyone (~12 KB gzip).
- Sentences assembled from fragments around inline elements translate fragment by fragment; a few read slightly stiff.
### Risks
- Text that the codemod's rules did not recognise stays Indonesian in English mode → the scan script plus a browser pass over the main flows; leftovers are cosmetic, never functional.
- Identical Indonesian words needing different English by context share one key → split by rewording the Indonesian when found.

## Dependencies
- ADR-009 (journey gains the language step; help content gets an English file).
