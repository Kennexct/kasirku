# Browser flow checks (Playwright, Python)

```bash
npm run build && npx vite preview --port 4173 &
python3 -I e2e/flow.py   http://localhost:4173 ./shots              # sale on tablet + phone, cash + QRIS
python3 -I e2e/manage.py http://localhost:4173 ./shots e2e/fixtures # QRIS upload, new product, open order -> pay
python3 -I e2e/history.py http://localhost:4173 ./shots              # 2 sales -> partial refund + void -> totals
python3 -I e2e/staff.py   http://localhost:4173 ./shots              # owner PIN, cashier, switch seller, PIN-approved discount + void, gate, lockout
python3 -I e2e/customers.py http://localhost:4173 ./shots            # add customer, attach + quick-add at POS, receipt/WhatsApp, stats, delete
python3 -I e2e/v08.py     http://localhost:4173 ./shots              # add/rename/move/delete method + mode, sold-out, unpaid customers + reminder, history after removals
python3 -I e2e/v10.py     http://localhost:4173 ./shots              # first-time journey with a template, Langkah awal, help page + contextual help
python3    e2e/v09.py     http://localhost:4173 ./shots              # cost price -> profit + Excel, expenses, close of day (short, reopen, exact), backup -> restore (needs openpyxl)
python3    e2e/reports.py http://localhost:4173 ./shots              # sales + refund -> Reports -> download XLSX/PDF/CSV and verify (needs openpyxl)
```
Both print `ERRORS: none` when no page errors, console errors or failed requests occurred. Screenshots land in `./shots`.
Since v0.10 a fresh browser profile opens the first-time journey; every older flow presses "Lewati, pakai contoh toko" first.
