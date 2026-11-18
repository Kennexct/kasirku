# Runbook — Payment methods, sales modes, sold-out, unpaid customers (v0.8)

| Symptom | Cause | Action |
| --- | --- | --- |
| "… sudah ada." when adding or renaming | Another method/mode has that name (capital letters are ignored) | Pick a different name, or rename/delete the existing one. |
| "Tambah metode" / "Tambah mode" is greyed out | Limit reached: 12 methods, 8 modes | Delete one that is not used. |
| "Harus ada minimal satu metode pembayaran aktif." | Trying to delete or switch off the only active method | Activate or add another method first. |
| "Mode default tidak bisa dihapus." | — | Make another mode the default (star button), then delete. |
| "Masih ada N pesanan tersimpan dengan mode ini." | Unpaid saved orders were priced in that mode | Take payment for, or cancel, those orders under Pesanan; then delete. |
| A deleted method still shows in history and reports | By design: past sales keep the name they were made with | Use the "(dihapus)" entry in the history filter to find them. |
| Seller cannot add an item, tile says "Habis" | Item is marked sold out | Kasir → the box-with-cross button next to search → switch the item back. Tapping the tile opens the same list. |
| Everything is still "Habis" the next morning | Sold-out is manual until close-of-day ships (v0.9) | Open the sold-out list; items marked sold out are at the top. |
| Customer missing from "Belum bayar" | The order was saved without picking a customer | Pesanan → open the order → add the customer → save again. |
| No "Ingatkan via WhatsApp" button | Customer has no phone number | Pelanggan → open → Ubah → add the number. |
| Amount owed looks wrong | It is the sum of that customer's saved, unpaid orders — no partial payments | Check the orders under Pesanan. |
