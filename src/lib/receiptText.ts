import type { Order, Store } from '../types';
import { formatRupiah } from './money';

const DIVIDER = '--------------------------------';

/** Plain-text receipt for WhatsApp sharing (M9). Pure function: easy to test. */
export function buildReceiptText(order: Order, store: Pick<Store, 'name' | 'address' | 'phone' | 'receiptFooter'>): string {
  const lines: string[] = [`*${store.name}*`];
  if (store.address) lines.push(store.address);
  if (store.phone) lines.push(store.phone);
  lines.push(DIVIDER, `No: ${order.receiptNo}`, `Mode: ${order.salesModeNameSnapshot}`);
  if (order.label) lines.push(`Pesanan: ${order.label}`);
  lines.push(DIVIDER);

  for (const item of order.items) {
    lines.push(`${item.qty}x ${item.nameSnapshot}  ${formatRupiah(item.unitPrice * item.qty)}`);
    if (item.options.length > 0) lines.push(`   ${item.options.map((o) => o.name).join(', ')}`);
    if (item.note) lines.push(`   Catatan: ${item.note}`);
  }

  const { totals } = order;
  lines.push(DIVIDER, `Subtotal  ${formatRupiah(totals.subtotal)}`);
  const discount = totals.itemDiscountTotal + totals.orderDiscountTotal;
  if (discount > 0) lines.push(`Diskon  -${formatRupiah(discount)}`);
  if (totals.serviceTotal > 0) lines.push(`Service  ${formatRupiah(totals.serviceTotal)}`);
  if (totals.taxTotal > 0) lines.push(`Pajak  ${formatRupiah(totals.taxTotal)}`);
  lines.push(`*Total  ${formatRupiah(totals.grandTotal)}*`);

  for (const payment of order.payments) {
    lines.push(`${payment.methodNameSnapshot}  ${formatRupiah(payment.cashReceived ?? payment.amount)}`);
    if (payment.reference) lines.push(`Ref: ${payment.reference}`);
    if (payment.change !== undefined && payment.change > 0) lines.push(`Kembali  ${formatRupiah(payment.change)}`);
  }
  if (store.receiptFooter) lines.push(DIVIDER, store.receiptFooter);
  return lines.join('\n');
}

export function whatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
