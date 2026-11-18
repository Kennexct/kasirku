# Browser flow checks (Playwright, Python)

```bash
npm run build && npx vite preview --port 4173 &
python3 -I e2e/flow.py   http://localhost:4173 ./shots              # sale on tablet + phone, cash + QRIS
python3 -I e2e/manage.py http://localhost:4173 ./shots e2e/fixtures # QRIS upload, new product, open order -> pay
python3 -I e2e/history.py http://localhost:4173 ./shots              # 2 sales -> partial refund + void -> totals
python3 -I e2e/staff.py   http://localhost:4173 ./shots              # owner PIN, cashier, switch seller, PIN-approved discount + void, gate, lockout
python3    e2e/reports.py http://localhost:4173 ./shots              # sales + refund -> Reports -> download XLSX/PDF/CSV and verify (needs openpyxl)
```
Both print `ERRORS: none` when no page errors, console errors or failed requests occurred. Screenshots land in `./shots`.
