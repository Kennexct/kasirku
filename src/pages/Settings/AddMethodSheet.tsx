import { useState } from 'react';
import toast from 'react-hot-toast';
import { Sheet } from '../../components/ui/Sheet';
import { btnPrimary, helperText, inputBase, labelBase, option } from '../../components/ui/styles';
import { CONFIG_NAME_MAX, PAYMENT_TYPE_LABEL } from '../../constants';
import { createPaymentMethod } from '../../services/checkoutConfig';
import type { Id, PaymentType } from '../../types';
import { METHOD_ICON } from '../../components/ui/paymentIcon';
import { t } from '../../i18n';

const TYPES: readonly PaymentType[] = ['ewallet', 'transfer', 'qris', 'cash', 'other'];

const TYPE_HELP: Record<PaymentType, string> = {
  ewallet: t('GoPay, OVO, DANA, ShopeePay, dan sejenisnya. Nomor referensi bisa dicatat.'),
  transfer: t('Transfer ke rekening bank. Nomor referensi bisa dicatat.'),
  qris: t('Anda bisa mengunggah gambar QRIS statis untuk ditampilkan ke pembeli.'),
  cash: t('Uang tunai: kasir memasukkan uang diterima dan melihat kembalian.'),
  other: t('Cara bayar lain, misalnya voucher atau kupon makan.'),
};

export function AddMethodSheet({ storeId, onClose }: { storeId: Id; onClose: () => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<PaymentType>('ewallet');
  const [isSaving, setIsSaving] = useState(false);

  const submit = async () => {
    setIsSaving(true);
    try {
      const method = await createPaymentMethod(storeId, { name, type });
      toast.success(t('{0} ditambahkan', method.name));
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Gagal menambah metode.'));
      setIsSaving(false);
    }
  };

  return (
    <Sheet
      title={t('Tambah metode pembayaran')}
      isOpen
      onClose={onClose}
      footer={
        <button type="button" disabled={isSaving || name.trim() === ''} onClick={() => void submit()} className={`${btnPrimary} w-full`}>
          {t('Tambah metode')}
        </button>
      }
    >
      <div className="flex flex-col gap-5">
        <div>
          <label htmlFor="method-name" className={labelBase}>{t('Nama metode')}</label>
          <input id="method-name" autoFocus value={name} maxLength={CONFIG_NAME_MAX} placeholder={t('mis. GoPay, Transfer BCA')} onChange={(e) => setName(e.target.value)} className={inputBase} />
        </div>
        <div>
          <p className={labelBase}>{t('Jenis')}</p>
          <div role="radiogroup" aria-label={t('Jenis metode')} className="grid grid-cols-3 gap-2">
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
