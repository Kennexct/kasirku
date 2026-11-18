# ADR-004: Persistent seller session with time-boxed owner unlock and one-time approvals

**Status:** Accepted
**Date:** 2026-11-18
**Feature:** staff-pin
**Author:** 10x-Team (Architect + Staff Engineer)

## Context
One shared device, several people. Checkout speed is the product's core promise, so PIN prompts must stay out of the selling path. The user chose option A: selling stays open; owner powers time out.

## Decision
Two independent pieces of session state:
1. **Active seller** — a member id persisted in `localStorage`; role and name are re-read from the database at boot (never trusted from storage). Changing seller requires that member's PIN.
2. **Owner access** — a discriminated union consumed by every privileged path:
   - `open` — store has no owner PIN (legacy behaviour),
   - `unlocked` — owner PIN entered on an owner-gated screen; `ownerUnlockedUntil` kept **in memory only**, sliding 5 minutes on interaction inside gated screens, cleared on Kunci, reload, or seller switch,
   - `approved` — one-time grant from a PIN prompt (`grantedAt`, valid 5 minutes) passed to a single action; never widens screen access,
   - `locked`.
- `lib/permissions.requiresOwnerPin(level, access, now)` is the single rule; services re-check it (not only the UI) and record `approvedById`.
- Stored levels `owner_only` and `cashier_with_pin` are treated identically ("needs owner PIN").
- `requestOwnerApproval(reason)` is a promise-based prompt (zustand store + one host component) so any screen can ask without prop-drilling.

## Alternatives Considered
| Alternative | Pros | Cons | Why Not |
| --- | --- | --- | --- |
| Whole-device lock after idle (option B) | Stronger attribution of each sale | PIN in the selling path; hurts solo owners in quiet hours | User chose A |
| Role = active seller's role only (owner signed in ⇒ full powers until switch) | Simplest | Owner who forgets to switch leaves full powers open all day | Common failure on shared devices |
| Any owner-PIN entry unlocks owner mode for 5 min | One concept | A void approval would hand the cashier Reports/Settings for 5 minutes | Violates least privilege |

## Consequences
### Positive
- Zero prompts while selling; least-privilege approvals; one rule function for UI and services.
### Negative
- Sales may be attributed to a seller who forgot to switch (attribution gap, not a privilege gap).
- Two concepts (seller vs owner access) to explain in UI copy.
### Risks
- Timer-based lock relies on the page being alive; reload always locks (state not persisted), so the failure mode is "locked", never "open".

## Dependencies
- ADR-003 for PIN verification. `owner-login` will add a server-verified variant of `unlocked`.
