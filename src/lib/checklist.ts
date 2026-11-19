import { ROUTES } from '../constants';

/** "Langkah awal" (ADR-009): every item is derived from facts in the database — nothing is ticked by hand. */
export interface ChecklistFacts {
  hasEditedMenu: boolean;
  hasSale: boolean;
  hasOwnerPin: boolean;
  /** QRIS is one of the active payment methods. */
  usesQris: boolean;
  hasQrisImage: boolean;
  hasClosing: boolean;
  hasBackup: boolean;
}

export interface ChecklistItem {
  id: 'menu' | 'sale' | 'pin' | 'qris' | 'closing' | 'backup';
  label: string;
  hint: string;
  isDone: boolean;
  to: string;
}

export function buildChecklist(facts: ChecklistFacts): ChecklistItem[] {
  const items: Array<ChecklistItem | null> = [
    { id: 'menu', label: 'Sesuaikan menu', hint: 'Ubah nama, harga, atau tambah menu Anda sendiri.', isDone: facts.hasEditedMenu, to: ROUTES.products },
    { id: 'sale', label: 'Coba transaksi pertama', hint: 'Ketuk menu, lalu Bayar.', isDone: facts.hasSale, to: ROUTES.pos },
    facts.usesQris
      ? { id: 'qris', label: 'Unggah gambar QRIS', hint: 'Supaya bisa ditampilkan ke pelanggan saat membayar.', isDone: facts.hasQrisImage, to: `${ROUTES.settings}?tab=payments` }
      : null,
    { id: 'pin', label: 'Pasang PIN pemilik', hint: 'Melindungi laporan, produk, dan pengaturan.', isDone: facts.hasOwnerPin, to: `${ROUTES.settings}?tab=staff` },
    { id: 'closing', label: 'Tutup kasir pertama', hint: 'Hitung uang laci di akhir hari.', isDone: facts.hasClosing, to: ROUTES.cash },
    { id: 'backup', label: 'Cadangkan data', hint: 'Simpan salinan data toko ke berkas.', isDone: facts.hasBackup, to: `${ROUTES.settings}?tab=backup` },
  ];
  return items.filter((item): item is ChecklistItem => item !== null);
}

export const checklistProgress = (items: readonly ChecklistItem[]): { done: number; total: number; isComplete: boolean } => {
  const done = items.filter((item) => item.isDone).length;
  return { done, total: items.length, isComplete: done === items.length };
};
