# ADR-003: Verify staff PINs on the device with PBKDF2 (WebCrypto)

**Status:** Accepted
**Date:** 2026-11-18
**Feature:** staff-pin
**Author:** 10x-Team (Architect + Staff Engineer + Security)

## Context
PIN checks must work offline at a street stall. PINs are 4–6 digits (≤ 1.1 M combinations). The PRD and the `StoreMember.pinHash` comment said "bcrypt". The device's IndexedDB is readable by anyone with developer-tools access to the device.

## Decision
- Hash with **PBKDF2-HMAC-SHA-256, 150 000 iterations, 16-byte random salt per secret**, via the browser's built-in `crypto.subtle`. Stored as `pbkdf2-sha256$<iterations>$<salt b64>$<hash b64>` so parameters can be raised later without a schema change.
- Verification compares in constant time. The PIN is never stored, logged or put in audit payloads.
- **Lockout** per member per device: 5 free attempts, then 30 s / 1 min / 5 min / 15 min; counters in Dexie `meta` (survive reload).
- **Owner recovery code:** 8 characters from a 32-symbol unambiguous alphabet (≈ 1.1 × 10¹² combinations), shown once, stored only as a hash (`StoreMember.recoveryHash`); using it issues a new code.

## Alternatives Considered
| Alternative | Pros | Cons | Why Not |
| --- | --- | --- | --- |
| `bcryptjs` (as the PRD said) | Familiar; pgcrypto can verify `bf` hashes | New dependency (+ JS-speed hashing on cheap phones: 200–800 ms); no security gain for a 6-digit secret | WebCrypto is native, faster, zero bytes; an Edge Function can verify PBKDF2 equally |
| Argon2 (WASM) | Memory-hard | ~30–100 KB WASM, slow start on low-end Android; PIN space still tiny | Cost without benefit at this entropy |
| Verify on the server only | Tamper-proof | Fails offline — violates the core requirement | Deferred to `owner-login` as an additional online check |
| Store PINs in plain text | Simplest | Shoulder-surf-free reading of every PIN from storage or a synced table | Unacceptable |

## Consequences
### Positive
- No dependency, works offline, ~50–150 ms per check on mid-range phones.
- Format is self-describing and upgradeable.
### Negative
- Requires a secure context (HTTPS or localhost) — already true for a PWA.
- Deviates from the PRD wording ("bcrypt") — PRD to be updated.
### Risks
- **Offline brute force:** anyone who extracts a hash can recover a 4–6 digit PIN in minutes regardless of algorithm. Mitigation: lockout at the UI, audit trail, honest product copy; server-side enforcement in `owner-login`.
- Lockout counters are local and can be cleared by someone with devtools — same attacker class as above.

## Dependencies
- Future `owner-login` should restrict `pin_hash`/`recovery_hash` columns to the owner session when sync-pull exists.
