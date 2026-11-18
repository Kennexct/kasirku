# Security Review — staff-pin (M15 part 1)

**Date:** 2026-11-18 · **Verdict:** PASS with documented limits (no blocking findings for the stated threat model)

## Threat model
Protect against: a cashier at the counter voiding/refunding/discounting or opening owner screens without the owner; guessing a PIN by trying. Explicitly **not** protected (until server-side enforcement in `owner-login`): anyone with developer-tools access to the device.

| Threat | Assessment | Control |
| --- | --- | --- |
| PIN guessing at the pad | Mitigated | 5 tries → 30 s, 1 min, 5 min, 15 min; counter persisted in Dexie; `pin_locked` audit event |
| Shoulder-surf / reading PINs from storage as text | Mitigated | Only PBKDF2-SHA-256 hashes (150k iterations, per-secret salt); e2e asserts no plain PIN in members or audit |
| PIN leakage via logs, toasts, audit, zustand, localStorage | None found | Scan: no `console.*`; localStorage holds only the active member id; audit payloads carry no secrets; PIN lives in component state/args only |
| Approval reuse | Mitigated | One-time grant, 5-minute expiry enforced in the service (`requiresOwnerPin`), cleared when the sheet closes; does not unlock screens |
| Owner mode left open | Mitigated | In-memory only; locks on reload, seller switch, Kunci, or 5 minutes without use |
| UI bypass by calling services | Partly | Void/refund re-check the rule in the service. Staff management relies on the gated screen (tech debt) |
| **Offline brute force of a hash** | **Accepted limit** | A 4–6 digit PIN falls in minutes to anyone who extracts the hash, with any algorithm. Stated in spec/ADR-003; UI copy makes no stronger claim |
| **Storage tampering** (clear lockout rows, set `kasirku-active-member`, edit settings in IndexedDB) | **Accepted limit** | Same attacker class (devtools). Needs server-side enforcement |
| Recovery code | OK | 8 symbols from 32 (~1.1 × 10¹²), shown once, stored hashed, attempt-limited, rotated on use |
| Hash exposure after sync | Note for `owner-login` | `pin_hash`/`recovery_hash` are readable by any store member under current RLS — restrict columns before non-owner sessions exist |
| Dependencies | OK | No new dependency; `npm audit --omit=dev`: 0 vulnerabilities |

## Recommendations (non-blocking)
1. `owner-login`: verify the owner PIN (or account) server-side for void/refund when online; restrict hash columns.
2. Gate "cancel open order" behind the same rule if owners ask for it.
3. Pass an access argument to staff-management services.
