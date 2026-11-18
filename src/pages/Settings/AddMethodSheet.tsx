import { useState } from 'react';
import toast from 'react-hot-toast';
import { Sheet } from '../../components/ui/Sheet';
import { btnPrimary, helperText, inputBase, labelBase, option } from '../../components/ui/styles';
import { CONFIG_NAME_MAX, PAYMENT_TYPE_LABEL } from '../../constants';
import { createPaymentMethod } from '../../services/checkoutConfig';
import type { Id, PaymentType } from '../../types';
import { METHOD_ICON } from '../../components/ui/paymentIcon';

const TYPES: readonly PaymentType[] = ['ewallet', 'transfer', 'qris', 'cash', 'other'];

const TYPE_HELP: Record<PaymentType, string> = {
  ewallet: 'GoPay, OVO, DANA, ShopeePay, dan sejenisnya. Nomor referensi bisa dicatat.',
  transfer: 'Transfer ke rekening bank. Nomor referensi bisa dicatat.',
  qris: 'Anda bisa mengunggah gambar QRIS statis untuk ditampilkan ke pembeli.',
  cash: 'Uang tunai: kasir memasukkan uang diterima dan melihat kembalian.',
  other: 'Cara bayar lain, misalnya voucher atau kupon makan.',
};

export function AddMethodSheet({ storeId, onClose }: { storeId: Id; onClose: () => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<PaymentType>('ewallet');
  const [isSaving, setIsSaving] = useState(false);

  const submit = async () => {
    setIsSaving(true);
    try {
      const method = await createPaymentMethod(storeId, { name, type });
      toast.success(`${method.name} ditambahkan`);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menambah metode.');
      setIsSaving(false);
    }
  };

  return (
    <Sheet
      title="Tambah metode pembayaran"
      isOpen
      onClose={onClose}
      footer={
        <button type="button" disabled={isSaving || name.trim() === ''} onClick={() => void submit()} className={`${btnPrimary} w-full`}>
          Tambah metode
        </button>
      }
    >
      <div className="flex flex-col gap-5">
        <div>
          <label htmlFor="method-name" className={labelBase}>Nama metode</label>
          <input id="method-name" autoFocus value={name} maxLength={CONFIG_NAME_MAX} placeholder="mis. GoPay, Transfer BCA" onChange={(e) => setName(e.target.value)} className={inputBase} />
        </div>
        <div>
          <p className={labelBase}>Jenis</p>
          <div role="radiogroup" aria-label="Jenis metode" className="grid grid-cols-3 gap-2">
            {TYPES.map((value) => {
              const Icon = METHOD_ICON[value];
              return (
                <button key={value} type="button" role="radio" aria-checked={type === value} onClick={() => setType(value)} className={`${option(type === value)} h-[68px] flex-col gap-1 px-2 text-[13px]`}>
                  <Icon aria-hidden size={22} />
                  {PAYMENT_TYPE_LABEL[value]}
                </button>
              );
            })}
          </div>
          <p className={helperText}>{TYPE_HELP[type]}</p>
        </div>
      </div>
    </Sheet>
  );
}
