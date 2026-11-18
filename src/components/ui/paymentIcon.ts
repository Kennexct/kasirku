import { Banknote, CircleDollarSign, Landmark, QrCode, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PaymentType } from '../../types';

export const METHOD_ICON: Record<PaymentType, LucideIcon> = {
  cash: Banknote,
  qris: QrCode,
  transfer: Landmark,
  ewallet: Wallet,
  other: CircleDollarSign,
};
