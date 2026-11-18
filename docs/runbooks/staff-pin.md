# Runbook — Staff & PINs

| Symptom | Cause | Action |
| --- | --- | --- |
| Owner forgot PIN | — | PIN pad → "Lupa PIN?" → recovery code + new PIN. A new recovery code is shown; write it down. |
| Owner forgot PIN **and** lost the recovery code | No server account yet | Not recoverable in this version without clearing app data (loses unsynced sales). Escalate; `owner-login` adds account-based reset. |
| Cashier forgot PIN | — | Owner: Pengaturan → Staf & PIN → Reset PIN. |
| "Terlalu banyak percobaan" | 5+ wrong PINs | Wait for the countdown (30 s → 15 min). A correct PIN afterwards resets the counter. |
| Reports/Produk/Pengaturan ask for a PIN again | Owner mode locks after 5 minutes without use, on reload, on Kunci, or when the seller changes | Expected (ADR-004). |
| Void/refund says "Persetujuan kedaluwarsa" | Approval older than 5 minutes | Close the sheet and ask for the owner PIN again. |
| "Siapa yang berjualan?" at start | PIN exists and the remembered seller was deactivated or storage was cleared | Pick a name and enter its PIN. |
| Sales under the wrong name | Seller didn't switch | Avatar → Ganti kasir. Past sales are not re-attributed. |

## Database
Forward: apply `20261118020000_member_recovery_hash.sql` (additive). Rollback: `alter table public.store_members drop column recovery_hash;` — only before clients sync owner rows containing it.
