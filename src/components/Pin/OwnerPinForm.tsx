import { useState } from 'react';
import toast from 'react-hot-toast';
import { isValidPin } from '../../lib/pin';
import { resetOwnerPinWithRecovery, verifyMemberPin } from '../../services/staff';
import { useSessionStore } from '../../store/useSessionStore';
import { btnGhost, btnPrimary, inputBase, labelBase } from '../ui/styles';
import { PinInput } from './PinInput';
import { PinPad } from './PinPad';
import { RecoveryCodeNotice } from './RecoveryCodeNotice';

type Step = 'pin' | 'recovery' | { newCode: string };

/** Owner PIN entry with a "Lupa PIN?" path (recovery code → new PIN → new code). */
export function OwnerPinForm({ onVerified }: { onVerified: () => void }) {
  const storeId = useSessionStore((s) => s.storeId);
  const ownerId = useSessionStore((s) => s.ownerId);
  const [step, setStep] = useState<Step>('pin');
  const [code, setCode] = useState('');
  const [newPin, setNewPin] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  if (!storeId || !ownerId) return null;

  if (step === 'pin') {
    return (
      <div className="flex flex-col items-center gap-2">
        <PinPad label="PIN pemilik" verify={(pin) => verifyMemberPin(ownerId, pin)} onSuccess={onVerified} />
        <button type="button" onClick={() => setStep('recovery')} className={`${btnGhost} text-[14px] text-brand-700!`}>
          Lupa PIN?
        </button>
      </div>
    );
  }

  if (step !== 'recovery') return <RecoveryCodeNotice code={step.newCode} onDone={onVerified} />;

  const recover = async () => {
    setIsBusy(true);
    try {
      const result = await resetOwnerPinWithRecovery(storeId, code, newPin);
      setStep({ newCode: result.recoveryCode });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengatur ulang PIN.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor="recovery-code" className={labelBase}>Kode pemulihan</label>
        <input id="recovery-code" value={code} autoComplete="off" autoCapitalize="characters" placeholder="ABCD-EFGH" onChange={(e) => setCode(e.target.value)} className={`${inputBase} font-mono uppercase tracking-[0.1em]`} />
      </div>
      <div>
        <label htmlFor="recovery-new-pin" className={labelBase}>PIN pemilik baru</label>
        <PinInput id="recovery-new-pin" value={newPin} onChange={setNewPin} />
      </div>
      <button type="button" disabled={isBusy || code.trim() === '' || !isValidPin(newPin)} onClick={() => void recover()} className={btnPrimary}>
        {isBusy ? 'Memeriksa…' : 'Atur ulang PIN'}
      </button>
      <button type="button" onClick={() => setStep('pin')} className={`${btnGhost} text-[14px]`}>
        Kembali ke PIN
      </button>
    </div>
  );
}
