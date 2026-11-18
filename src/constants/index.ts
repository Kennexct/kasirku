import type { OrderStatus, PaymentType, RefundReason, StoreRules } from '../types';

export const PAYMENT_TYPE_LABEL: Record<PaymentType, string> = {
  cash: 'Tunai',
  qris: 'QRIS',
  transfer: 'Transfer',
  ewallet: 'E-wallet',
  other: 'Lainnya',
};

export const REFUND_REASON_LABEL: Record<RefundReason, string> = {
  wrong_input: 'Salah input',
  customer_cancel: 'Pelanggan batal',
  out_of_stock: 'Produk habis',
  other: 'Lainnya',
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  open: 'Belum dibayar',
  paid: 'Lunas',
  void: 'Void',
  refunded: 'Direfund',
  partial_refund: 'Refund sebagian',
  cancelled: 'Dibatalkan',
};

export const APP_NAME = 'KasirKu';
export const LOCALE = 'id-ID';
export const CURRENCY = 'IDR';

export const MAX_PAYMENTS_PER_ORDER = 2;
export const MAX_EXPORT_RANGE_DAYS = 366;
export const CLIENT_EXPORT_MAX_DAYS = 31;
export const LOCAL_HISTORY_DAYS = 30;

export const PHOTO_MAX_INPUT_BYTES = 10 * 1024 * 1024;
export const PHOTO_MAX_OUTPUT_BYTES = 200 * 1024;
export const PHOTO_MAX_DIMENSION_PX = 600;

export const PIN_MIN_LENGTH = 4;
export const PIN_MAX_LENGTH = 6;
/** ADR-003: PBKDF2-HMAC-SHA-256 work factor for PIN and recovery-code hashes. */
export const PIN_PBKDF2_ITERATIONS = 150_000;
export const PIN_FREE_ATTEMPTS = 5;
/** Wait after the 5th, 6th, 7th, 8th+ consecutive wrong PIN. */
export const PIN_LOCK_STEPS_MS = [30_000, 60_000, 300_000, 900_000] as const;
/** ADR-004: owner powers re-lock this long after last use; one-time approvals expire after the same time. */
export const OWNER_UNLOCK_MS = 5 * 60_000;
export const ACTIVE_MEMBER_STORAGE_KEY = 'kasirku-active-member';
export const MEMBER_NAME_MAX = 40;
export const CONFIG_NAME_MAX = 40;
export const MAX_PAYMENT_METHODS = 12;
export const MAX_SALES_MODES = 8;

export const SYNC_INTERVAL_MS = 15_000;
export const SYNC_BATCH_SIZE = 100;
export const SYNC_MAX_ATTEMPTS = 10;

export const PERCENT_MAX = 100;

export const DEFAULT_STORE_RULES: StoreRules = {
  voidPermission: 'cashier_with_pin',
  refundPermission: 'owner_only',
  refundWindowDays: 7,
  cashierMaxDiscountPct: 20,
  isReasonRequired: true,
  shouldAutoShowReceipt: true,
} as const;

export const DEFAULT_SALES_MODES = ['Dine In', 'Takeaway'] as const;

export const DEFAULT_PAYMENT_METHODS = [
  { name: 'Tunai', type: 'cash', referenceMode: 'off', referenceLabel: '' },
  { name: 'QRIS', type: 'qris', referenceMode: 'optional', referenceLabel: 'No. Ref' },
  { name: 'Transfer Bank', type: 'transfer', referenceMode: 'optional', referenceLabel: '4 digit terakhir' },
] as const;

/** Quick cash buttons shown on the payment screen. */
export const QUICK_CASH_AMOUNTS = [10_000, 20_000, 50_000, 100_000] as const;

export const ROUTES = {
  login: '/login',
  pos: '/',
  openOrders: '/pesanan',
  history: '/riwayat',
  reports: '/laporan',
  products: '/produk',
  customers: '/pelanggan',
  settings: '/pengaturan',
  more: '/lainnya',
} as const;
