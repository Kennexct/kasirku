# v0.11 — English

**Date:** 2026-11-19 · **Status:** Approved in the feedback-round roadmap; detail decided by the team · **ADR:** 010

## Why
Some owners, staff and accountants read English more easily than Indonesian; exports and receipts are also shared with people who do.

## What changes
- Every screen, message, receipt, WhatsApp text, export and help topic is available in **Indonesian and English**.
- Language is a **per-device** setting: first launch follows the device language (English device → English, anything else → Indonesian); the first-time journey starts with a language choice; it can be changed in Pengaturan → Toko & Struk and on the "who is selling" PIN screen. Changing it reloads the app.
- **Not translated:** what the merchant typed (store, product, category, variant, customer names, notes, method and mode names). Starter-template names are created in the language chosen during setup and are then merchant data.
- Money stays `Rp12.500` in both languages. Dates follow the language (19 Nov 2026 / Thursday…).

## Out of scope
Per-user language, more languages, translating merchant data, right-to-left, currency switching.

## Success criteria
- No Indonesian interface text remains in English mode on the main flows (journey, sale, receipt, history, Kas, reports, settings, help), checked in the browser.
- A missing English text is a compile error, not a runtime gap.
- All existing unit tests and browser flows still pass in Indonesian, unchanged.
