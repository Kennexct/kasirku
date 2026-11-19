import { useLiveQuery } from 'dexie-react-hooks';
import { Download, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Sheet } from '../../components/ui/Sheet';
import { badgeWarn, btnDangerSolid, btnPrimary, btnSecondary, helperText } from '../../components/ui/styles';
import { localDb } from '../../db/localDb';
import type { BackupFile } from '../../lib/backup';
import { downloadBlob } from '../../lib/export/deliver';
import { clearDeviceSession, createBackup, getLastBackupAt, markBackedUp, readBackupFile, restoreBackup } from '../../services/backup';
import { SettingsSection } from './SettingsSection';

const STALE_AFTER_DAYS = 7;
const MS_PER_DAY = 86_400_000;
const dateTime = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const formatWhen = (iso: string) => (iso ? dateTime.format(new Date(iso)) : 'waktu tidak diketahui');
const errorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Terjadi kesalahan.');

/** What a file (or this device) holds, in the merchant's words. */
const CONTENT_ROWS: ReadonlyArray<{ table: string; label: string }> = [
  { table: 'orders', label: 'Transaksi' },
  { table: 'products', label: 'Produk' },
  { table: 'customers', label: 'Pelanggan' },
  { table: 'expenses', label: 'Pengeluaran' },
];

/** Settings → Cadangan (ADR-008): save every table to one file; restore replaces the device's data from a file. */
export function BackupSettings() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [candidate, setCandidate] = useState<BackupFile | null>(null);
  const [hasConfirmed, setHasConfirmed] = useState(false);

  const lastBackupAt = useLiveQuery(() => getLastBackupAt(), []);
  const deviceCounts = useLiveQuery(async () => Object.fromEntries(await Promise.all(CONTENT_ROWS.map(async ({ table }) => [table, await localDb.table(table).count()] as const))), []);
  const isStale = lastBackupAt === null || (typeof lastBackupAt === 'string' && Date.now() - new Date(lastBackupAt).getTime() > STALE_AFTER_DAYS * MS_PER_DAY);

  const save = async () => {
    setIsBusy(true);
    try {
      const { blob, fileName } = await createBackup();
      downloadBlob(blob, fileName);
      await markBackedUp();
      toast.success('Cadangan disimpan ke folder Unduhan');
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setIsBusy(false);
    }
  };

  const pick = async (file: File | undefined) => {
    if (!file) return;
    try {
      setCandidate(await readBackupFile(file));
      setHasConfirmed(false);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const restore = async () => {
    if (!candidate) return;
    setIsBusy(true);
    try {
      await restoreBackup(candidate);
      clearDeviceSession();
      window.location.assign('/');
    } catch (error) {
      toast.error(`Pemulihan gagal, data di perangkat ini tidak berubah. ${errorMessage(error)}`);
      setIsBusy(false);
    }
  };

  return (
    <>
      <SettingsSection title="Cadangkan data" description="Semua data toko ada di perangkat ini. Simpan salinannya agar tidak hilang kalau perangkat rusak, hilang, atau data browser terhapus.">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <p className="text-[14px] text-ink-soft">
            Terakhir dicadangkan: <span className="font-semibold text-ink">{lastBackupAt ? formatWhen(lastBackupAt) : 'belum pernah'}</span>
          </p>
          {isStale && <span className={badgeWarn}>{lastBackupAt ? `Lebih dari ${STALE_AFTER_DAYS} hari lalu` : 'Belum ada cadangan'}</span>}
        </div>
        <button type="button" disabled={isBusy} onClick={() => void save()} className={`${btnPrimary} mt-3 w-full sm:w-auto`}>
          <Download aria-hidden size={18} /> Simpan cadangan
        </button>
        <p className={helperText}>
          Satu berkas berisi produk, transaksi, pelanggan, pengeluaran, dan pengaturan. Kirim ke Google Drive atau WhatsApp Anda sendiri. Berkas memuat nomor HP pelanggan, jadi jangan dibagikan ke orang lain.
        </p>
      </SettingsSection>

      <SettingsSection title="Pulihkan dari cadangan" description="Untuk pindah ke perangkat baru atau mengembalikan data yang hilang. Data di perangkat ini diganti seluruhnya dengan isi berkas.">
        <input ref={fileInput} type="file" accept="application/json,.json" aria-label="Berkas cadangan" className="sr-only" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ''; }} />
        <button type="button" disabled={isBusy} onClick={() => fileInput.current?.click()} className={`${btnSecondary} w-full sm:w-auto`}>
          <Upload aria-hidden size={18} /> Pilih berkas cadangan
        </button>
        <p className={helperText}>Jangan dipakai untuk menjalankan dua perangkat sekaligus: nomor struk bisa kembar.</p>
      </SettingsSection>

      {candidate && (
        <Sheet
          title="Pulihkan cadangan ini?"
          subtitle={`${candidate.storeName} · dibuat ${formatWhen(candidate.exportedAt)}`}
          isOpen
          onClose={() => setCandidate(null)}
          footer={
            <div className="flex gap-2">
              <button type="button" disabled={isBusy} onClick={() => setCandidate(null)} className={btnSecondary}>Batal</button>
              <button type="button" disabled={isBusy || !hasConfirmed} onClick={() => void restore()} className={`${btnDangerSolid} flex-1`}>Ganti semua data</button>
            </div>
          }
        >
          <table className="w-full text-[14px]">
            <thead>
              <tr className="text-left text-[12px] font-semibold uppercase tracking-[0.06em] text-muted">
                <th className="pb-2 font-semibold">Isi</th>
                <th className="pb-2 text-right font-semibold">Perangkat ini</th>
                <th className="pb-2 text-right font-semibold">Cadangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line border-y border-line">
              {CONTENT_ROWS.map(({ table, label }) => (
                <tr key={table}>
                  <td className="py-2 text-ink-soft">{label}</td>
                  <td className="num py-2 text-right">{deviceCounts?.[table] ?? 0}</td>
                  <td className="num py-2 text-right font-semibold">{candidate.counts[table] ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 rounded-lg border border-danger-200 bg-danger-50 px-3.5 py-2.5 text-[13px] text-danger-700">
            Semua data di perangkat ini dihapus dan diganti isi cadangan. Apa pun yang dicatat setelah cadangan dibuat akan hilang dan tidak bisa dikembalikan.
          </p>
          <button type="button" disabled={isBusy} onClick={() => void save()} className={`${btnSecondary} mt-3 h-11 w-full text-[14px]`}>
            <Download aria-hidden size={17} /> Simpan data perangkat ini dulu
          </button>
          <label className="mt-4 flex cursor-pointer items-start gap-3 text-[14px] text-ink">
            <input type="checkbox" checked={hasConfirmed} onChange={(e) => setHasConfirmed(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-brand-600" />
            Saya mengerti data di perangkat ini akan diganti.
          </label>
        </Sheet>
      )}
    </>
  );
}
