import { Logo } from '../Brand/Logo';
import { SellerSwitcher } from './SellerSwitcher';

/** Shown at start-up when a PIN exists and no seller is remembered on this device. */
export function LockScreen() {
  return (
    <main className="flex min-h-dvh flex-col items-center bg-canvas px-4 py-10">
      <Logo size={36} />
      <h1 className="mt-8 text-[22px] font-bold tracking-[-0.02em]">Siapa yang berjualan?</h1>
      <p className="mb-6 mt-1 text-[14px] text-muted">Pilih nama Anda, lalu masukkan PIN.</p>
      <div className="w-full max-w-sm">
        <SellerSwitcher onDone={() => undefined} />
      </div>
    </main>
  );
}
