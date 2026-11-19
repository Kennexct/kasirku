# ADR-008: Backup file format and replace-all restore

**Status:** Accepted
**Date:** 2026-11-19
**Feature:** v09-backup
**Author:** 10x-Team (Architect + Security + SRE)

## Context
All business data lives in IndexedDB on one device; browsers can evict it, phones break. There is no server copy yet. Merchants need a way to keep a copy and to move to a new device without an account.

## Decision
- **Format:** one JSON file `{ app: "kasirku", formatVersion: 1, schemaVersion: <Dexie version>, exportedAt, storeName, counts, tables }`. `tables` holds every Dexie table except `outbox`; `meta` excludes PIN lockout counters. Photos and QRIS images are already data URLs inside records, so the file is self-contained.
- **Restore = replace all**, inside a single Dexie transaction (clear + bulk insert), so a failure leaves the old data untouched. The outbox is cleared and `meta.restoredAt` is set for the future sync to do a full re-push.
- **Validation before anything is deleted:** app marker, `formatVersion` supported, `schemaVersion` ≤ current, `tables` are arrays of objects with a string key, exactly one store, size ≤ 200 MB. Unknown tables are ignored.
- **Owner only** (Settings is behind the owner gate). The screen shows the file's store name, date and record counts, offers "save current data first", then asks for a final confirmation.
- After restore the cart and signed-in seller are cleared and the app reloads.
- The file is **not encrypted**; the screen says it contains customer contacts and should be kept private.

## Alternatives Considered
| Alternative | Pros | Cons | Why Not |
|-------------|------|------|---------|
| Wait for cloud sync | No file handling | Needs an account + project; no protection today | The risk exists now |
| Merge restore (by id / updatedAt) | Could combine two devices | Conflict rules, half-merged states, receipt-number collisions | Sync-pull will do this properly |
| Passphrase-encrypted file | Protects customer data at rest | A forgotten passphrase destroys the only backup | Worse failure for this audience; revisit with accounts |
| Dexie export/import add-on | Less code | Extra dependency in the main bundle, binary-ish format, less control over validation | A few dozen lines do the job |

## Consequences
### Positive
- Works offline, with no account; file can be sent to oneself via WhatsApp/Drive through the share sheet.
- Deterministic, testable round trip.
### Negative
- Plain file with personal data — responsibility moves to the merchant.
- Restoring an old file loses everything recorded after it (stated in the confirmation).
- Using a restored copy on a second device at the same time gives duplicate receipt numbers.
### Risks
- Malicious/corrupt file: validated shape, records only ever rendered as text or `<img src>`; no code paths evaluate file content.
- Large stores (photos) produce files of tens of MB; built in memory. Accepted up to 200 MB.

## Dependencies
- Future `sync-pull` must honour `meta.restoredAt` (full re-push) and replace this for multi-device use.
