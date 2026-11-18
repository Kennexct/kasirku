import { Banknote, CircleDollarSign, Landmark, QrCode, Upload, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useRef } from 'react';
import toast from 'react-hot-toast';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { btnSecondary, card, helperText, inputBase, labelBase } from '../../components/ui/styles';
import { Switch } from '../../components/ui/Switch';
import { compressQrisImage } from '../../lib/image';
import { savePaymentMethod } from '../../services/catalog';
import type { PaymentMethod, PaymentType, ReferenceMode } from '../../types';

const METHOD_ICON: Record<PaymentType, LucideIcon> = {
  cash: Banknote,
  qris: QrCode,
  transfer: Landmark,
  ewallet: Wallet,
  other: CircleDollarSign,
};

const REFERENCE_OPTIONS: ReadonlyArray<{ value: ReferenceMode; label: string }> = [
  { value: 'off', label: 'Tidak ada' },
  { value: 'optional', label: 'Opsional' },
  { value: 'required', label: 'Wajib' },
];

async function persist(method: PaymentMethod): Promise<void> {
  try {
    await savePaymentMethod(method);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Gagal menyimpan metode.');
  }
}

/** M5: activate methods, configure the reference field, upload the static QRIS image. Changes save instantly. */
export function PaymentMethodSettings({ methods }: { methods: PaymentMethod[] }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[14px] text-muted">Perubahan tersimpan otomatis.</p>
      {methods.map((method) => (
        <PaymentMethodCard key={method.id} method={method} />
      ))}
    </div>
  );
}

function PaymentMethodCard({ method }: { method: PaymentMethod }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const Icon = METHOD_ICON[method.type];
  const isCash = method.type === 'cash';

  const handleQris = async (file: File | undefined) => {
    if (!file) return;
    const result = await compressQrisImage(file);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    await persist({ ...method, qrisImageUrl: result.value });
    toast.success('Gambar QRIS disimpan');
  };

  return (
    <section className={`${card} overflow-hidden ${method.isActive ? '' : 'bg-subtle'}`}>
      <div className="flex items-center gap-3 px-5 py-2">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-ink-soft">
          <Icon aria-hidden size={20} />
        </span>
        <div className="flex-1">
          <Switch
            checked={method.isActive}
            onChange={(isActive) => void persist({ ...method, isActive })}
            label={method.name}
            description={method.isActive ? 'Tampil di layar pembayaran' : 'Disembunyikan dari kasir'}
          />
        </div>
      </div>

      {method.isActive && !isCash && (
        <div className="flex flex-col gap-4 border-t border-line px-5 py-4">
          <div>
            <p className={labelBase}>Nomor referensi</p>
            <SegmentedControl label={`Referensi ${method.name}`} options={REFERENCE_OPTIONS} value={method.referenceMode} onChange={(referenceMode) => void persist({ ...method, referenceMode })} />
            <p className={helperText}>Untuk mencocokkan dengan mutasi bank / aplikasi merchant.</p>
          </div>
          {method.referenceMode !== 'off' && (
            <div className="max-w-sm">
              <label htmlFor={`ref-${method.id}`} className={labelBase}>Label kolom referensi</label>
              <input
                id={`ref-${method.id}`}
                defaultValue={method.referenceLabel}
                placeholder="No. Ref / 4 digit terakhir"
                onBlur={(e) => e.target.value !== method.referenceLabel && void persist({ ...method, referenceLabel: e.target.value.trim() })}
                className={inputBase}
              />
            </div>
          )}

          {method.type === 'qris' && (
            <div>
              <p className={labelBase}>QRIS statis</p>
              <div className="flex items-center gap-4">
                {method.qrisImageUrl ? (
                  <img src={method.qrisImageUrl} alt="QRIS statis" className="h-28 w-28 rounded-lg border border-line bg-surface object-contain p-1" />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-lg border border-dashed border-line-strong bg-subtle text-faint">
                    <QrCode aria-hidden size={32} />
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <input ref={fileInput} type="file" accept="image/*" hidden onChange={(e) => void handleQris(e.target.files?.[0])} />
                  <button type="button" onClick={() => fileInput.current?.click()} className={`${btnSecondary} h-11 text-[14px]`}>
                    <Upload aria-hidden size={17} /> {method.qrisImageUrl ? 'Ganti gambar' : 'Unggah QRIS'}
                  </button>
                  <p className="max-w-[220px] text-[12px] text-muted">Screenshot QRIS dari bank atau aplikasi merchant Anda.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
