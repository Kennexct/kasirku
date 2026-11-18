import type { OrderStatus, RefundReason, StoreRules } from '../types';

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
