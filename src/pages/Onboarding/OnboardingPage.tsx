import { ArrowLeft, Banknote, Coffee, Cookie, Landmark, QrCode, Soup, SquareDashed, Upload, UtensilsCrossed } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Logo } from '../../components/Brand/Logo';
import { IntroCards } from '../../components/Help/IntroCards';
import { Switch } from '../../components/ui/Switch';
import { btnGhost, btnPrimary, btnSecondary, helperText, inputBase, labelBase, option } from '../../components/ui/styles';
import { compressQrisImage } from '../../lib/image';
import { DEFAULT_SETUP, STORE_NAME_MAX, TEMPLATE_IDS, TEMPLATES, type SeedSetup, type TemplateId } from '../../services/seedTemplate';

const TEMPLATE_ICON: Record<TemplateId, LucideIcon> = { bakso: Soup, kopi: Coffee, gorengan: Cookie, warung: UtensilsCrossed, kosong: SquareDashed };
const STEP_TITLES = ['Toko Anda', 'Cara pembayaran', 'Cara kerja KasirKu'] as const;
const LAST_STEP = STEP_TITLES.length - 1;

interface OnboardingPageProps {
  /** Creates the store and enters the app. Without a setup: the default example store ("Lewati"). */
  onComplete: (setup?: SeedSetup) => Promise<void>;
}

/** First-time journey (ADR-009): shown only when this device has no store yet. Three short steps, no account. */
export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [setup, setSetup] = useState<SeedSetup>({ ...DEFAULT_SETUP, storeName: '' });
  const [isBusy, setIsBusy] = useState(false);
  const update = (patch: Partial<SeedSetup>) => setSetup((current) => ({ ...current, ...patch }));

  const finish = async (chosen?: SeedSetup) => {
    setIsBusy(true);
    try {
      await onComplete(chosen);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyiapkan toko.');
      setIsBusy(false);
    }
  };

  const pickQris = async (file: File | undefined) => {
    if (!file) return;
    const result = await compressQrisImage(file);
    if (result.ok) update({ qrisImageUrl: result.value });
    else toast.error(result.error);
  };

  return (
    <main className="flex min-h-dvh flex-col items-center bg-canvas px-4 py-6 text-ink md:justify-center md:py-10">
      <div className="mb-5">
        <Logo size={34} />
      </div>
      <div className="w-full max-w-[560px] rounded-xl border border-line bg-surface shadow-xs">
        <header className="border-b border-line px-5 pb-4 pt-5">
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button type="button" aria-label="Kembali" onClick={() => setStep(step - 1)} className="-ml-2 flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft hover:bg-subtle">
                <ArrowLeft aria-hidden size={19} />
              </button>
            )}
            <p className="num text-[13px] font-semibold text-muted">Langkah {step + 1} dari {STEP_TITLES.length}</p>
          </div>
          <div aria-hidden className="mt-2.5 flex gap-1.5">
            {STEP_TITLES.map((title, index) => (
              <span key={title} className={`h-1 flex-1 rounded-full ${index <= step ? 'bg-brand-600' : 'bg-subtle'}`} />
            ))}
          </div>
          <h1 className="mt-4 text-[22px] font-bold tracking-[-0.02em]">{STEP_TITLES[step]}</h1>
        </header>

        <div className="px-5 py-5">
          {step === 0 && (
            <div className="flex flex-col gap-5">
              <div>
                <label htmlFor="store-name" className={labelBase}>Nama toko</label>
                <input id="store-name" autoFocus value={setup.storeName} maxLength={STORE_NAME_MAX} placeholder="mis. Bakso Pak Kumis" onChange={(e) => update({ storeName: e.target.value })} className={inputBase} />
                <p className={helperText}>Tampil di struk. Bisa diubah nanti.</p>
              </div>
              <div>
                <p className={labelBase}>Jenis usaha</p>
                <div role="radiogroup" aria-label="Jenis usaha" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {TEMPLATE_IDS.map((id) => {
                    const Icon = TEMPLATE_ICON[id];
                    const isSelected = setup.template === id;
                    return (
                      <button key={id} type="button" role="radio" aria-checked={isSelected} onClick={() => update({ template: id })} className={`${option(isSelected)} h-auto min-h-[60px] justify-start! gap-3 px-3.5 py-2.5 text-left`}>
                        <Icon aria-hidden size={22} className="shrink-0" />
                        <span className="min-w-0">
                          <span className="block text-[15px] font-semibold">{TEMPLATES[id].label}</span>
                          <span className={`block text-[13px] font-normal ${isSelected ? 'text-brand-700' : 'text-muted'}`}>{TEMPLATES[id].description}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className={helperText}>Kami siapkan contoh menu yang bisa Anda ubah atau hapus.</p>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3 py-2">
                <Banknote aria-hidden size={22} className="shrink-0 text-muted" />
                <div className="min-w-0 flex-1"><Switch checked disabled onChange={() => undefined} label="Tunai" description="Selalu tersedia, dengan hitung kembalian." /></div>
              </div>
              <div className="flex items-start gap-3 border-t border-line py-2">
                <QrCode aria-hidden size={22} className="mt-2.5 shrink-0 text-muted" />
                <div className="min-w-0 flex-1">
                  <Switch checked={setup.hasQris} onChange={(hasQris) => update({ hasQris })} label="QRIS" description="Tampilkan kode QRIS toko ke pelanggan." />
                  {setup.hasQris && (
                    <div className="mb-2 mt-1 flex items-center gap-3">
                      {setup.qrisImageUrl && <img src={setup.qrisImageUrl} alt="Gambar QRIS toko" className="h-14 w-14 rounded-md border border-line object-cover" />}
                      <input ref={fileInput} type="file" accept="image/*" aria-label="Gambar QRIS" className="sr-only" onChange={(e) => void pickQris(e.target.files?.[0])} />
                      <button type="button" onClick={() => fileInput.current?.click()} className={`${btnSecondary} h-10 text-[14px]`}>
                        <Upload aria-hidden size={16} /> {setup.qrisImageUrl ? 'Ganti gambar' : 'Unggah gambar QRIS'}
                      </button>
                      {!setup.qrisImageUrl && <span className="text-[13px] text-muted">Boleh nanti.</span>}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 border-t border-line py-2">
                <Landmark aria-hidden size={22} className="shrink-0 text-muted" />
                <div className="min-w-0 flex-1"><Switch checked={setup.hasTransfer} onChange={(hasTransfer) => update({ hasTransfer })} label="Transfer bank" description="Catat pembayaran lewat transfer." /></div>
              </div>
              <p className={helperText}>E-wallet dan cara bayar lain bisa ditambah di Pengaturan.</p>
            </div>
          )}

          {step === LAST_STEP && <IntroCards />}
        </div>

        <footer className="flex flex-col gap-2 border-t border-line px-5 py-4">
          {step < LAST_STEP ? (
            <button type="button" onClick={() => setStep(step + 1)} className={`${btnPrimary} w-full`}>Lanjut</button>
          ) : (
            <button type="button" disabled={isBusy} onClick={() => void finish(setup)} className={`${btnPrimary} w-full`}>Mulai jualan</button>
          )}
          {step === 0 && (
            <button type="button" disabled={isBusy} onClick={() => void finish()} className={`${btnGhost} w-full text-[14px]`}>Lewati, pakai contoh toko</button>
          )}
        </footer>
      </div>
      <p className="mt-4 max-w-[560px] text-center text-[13px] text-muted">Tanpa akun dan tanpa internet. Data toko tersimpan di perangkat ini.</p>
    </main>
  );
}
