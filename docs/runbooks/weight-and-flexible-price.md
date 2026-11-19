# Runbook — selling by weight and flexible price (v0.12)

| Symptom | Cause | Action |
| --- | --- | --- |
| "Dijual per" is missing in the product form | The setting is off | Pengaturan → Toko & Struk → "Aktifkan satuan berat dan ukuran" → Simpan perubahan. |
| Tapping a product adds it without asking the weight | The product is still "Satuan (pcs)" | Produk → open it → "Dijual per" → choose kg / ons / gram / liter / meter. |
| "Tambah ke pesanan" stays grey in the entry box | Weight is empty, zero, above 9 999, or not a number; or the price field is empty | Type digits with a comma or dot (0,75 or 0.75). |
| The buyer asked for Rp10.000 but the weight looks odd (0,333 kg) | The weight is calculated from the amount; the total is exactly the amount | Weigh out what the screen says. |
| Total differs by a few Rupiah from a hand calculation | price × weight is rounded to whole Rupiah per line | Expected. |
| A cashier sold below the normal price | The product has "Harga bisa diubah saat jual" on | Riwayat → open the sale: "Harga diubah saat jual" lists charged and normal price. Excel → sheet Item → columns Harga Satuan vs Harga Normal. Switch the option off on the product to fix the price. |
| The price did not change when switching Dine In → Takeaway | The seller had typed a price by hand; it is kept on purpose | Open the line (pencil) and press "Kembalikan ke harga normal". |
| Cannot refund half of a weighed line | Weighed lines are refunded whole | Refund the line, then sell the correct weight again. |
| "Item terjual" is lower than expected | A weighed line counts as one item | Use best sellers (Qty) for total weight per product. |
| Profit looks wrong for weighed goods | Cost price must be per the same unit as the selling price | Produk → "Harga modal" per kg (or the chosen unit). |
| Setting switched off but products still ask for weight | The setting only hides the choice; products keep their unit | Switch it on, set those products back to "Satuan (pcs)", switch it off. |
