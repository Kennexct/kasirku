# Runbook — Customers

| Symptom | Cause | Action |
| --- | --- | --- |
| "Nomor HP tidak valid" | Not an Indonesian mobile number (must start 08 / 628 / +628, 10–15 digits) | Fix the number or leave it empty. Landlines and foreign numbers are not supported. |
| "Nomor ini sudah dipakai oleh …" | Another active customer has the number | Open that customer instead, or correct the number. |
| WhatsApp button opens a contact chooser | The order's customer has no phone (or was deleted) | Add a phone to the customer; later receipts go straight to their chat. |
| Customer asks for their data to be removed | — | Pelanggan → open → Hapus. Phone and note are erased; the name stays on past receipts. |
| Deleted customer still named on old receipts/history | By design (ADR-005) | Explain: transaction records keep the name printed at the time. |
| Only 100 customers listed | Render cap | Use search. |
