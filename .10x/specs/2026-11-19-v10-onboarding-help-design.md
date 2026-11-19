# v0.10 — first-time journey and help centre

**Date:** 2026-11-19 · **Status:** Approved in the feedback-round roadmap; detail decided by the team · **ADR:** 009

## Why
A new merchant opens the app and lands in someone else's bakso menu with no explanation. Later, when they wonder how refunds, closing or backup work, there is nowhere to look — and they are often offline.

## First-time journey (only when the device has no store)
1. **Toko** — store name + kind of business: Bakso & mie · Kopi & minuman · Gorengan & jajanan · Warung makan · Mulai kosong. The choice seeds a small editable menu.
2. **Pembayaran** — Tunai is always on; switches for QRIS (optional upload of the static QRIS image) and Transfer bank.
3. **Cara kerja** — four short cards: sell, save an order / bon, close the day, back up. Then "Mulai jualan".
- "Lewati" on step 1 creates the default store (as before) — also what a device restored from backup never sees, because it already has a store.
- The language step joins in v0.11.

## Langkah awal (checklist)
Six items, each ticked automatically from the data — nothing to tick by hand: sesuaikan menu · transaksi pertama · pasang PIN pemilik · unggah QRIS (only when QRIS is on) · tutup kasir pertama · cadangkan data.
Shown as a slim banner on the cashier screen (new installs only, dismissible, disappears when complete) and in full on the help page.

## Help centre
- "Bantuan" page: search, 15 short topics (what it is, numbered steps, things to know), checklist, "Lihat lagi pengenalan".
- "?" button in the header of Riwayat, Laporan, Kas, Pelanggan and Pengaturan opens the matching topic in a sheet without leaving the screen.
- All content ships inside the app: works offline. No support contact button (no number provided).

## Out of scope
Videos, product tours with highlighted elements, chat support, analytics on help usage, per-role help.

## Success criteria
- A new device goes from first open to the first sale in the chosen template without touching Settings; exercised in the browser on tablet and phone.
- Every template is internally consistent (unit test). Checklist rules unit-tested.
- Devices that already have data see no onboarding; all existing flows pass.
