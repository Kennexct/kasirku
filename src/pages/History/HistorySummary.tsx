import { card } from '../../components/ui/styles';
import { formatRupiah } from '../../lib/money';
import type { SalesSummary } from '../../lib/salesSummary';

interface StatProps {
  label: string;
  value: string;
  hint?: string;
  isPrimary?: boolean;
}

function Stat({ label, value, hint, isPrimary = false }: StatProps) {
  return (
    <div className={`${card} min-w-0 px-3 py-3 md:px-4 ${isPrimary ? 'col-span-3 border-brand-200 bg-brand-50 md:col-span-1' : ''}`}>
      <p className={`truncate text-[13px] font-medium ${isPrimary ? 'text-brand-800' : 'text-muted'}`}>{label}</p>
      <p className={`num truncate font-bold tracking-[-0.02em] ${isPrimary ? 'text-[24px] text-brand-900 md:text-[22px]' : 'text-[16px] text-ink md:text-[22px]'}`}>{value}</p>
      {hint && <p className={`num truncate text-[12px] text-muted ${isPrimary ? '' : 'hidden md:block'}`}>{hint}</p>}
    </div>
  );
}

/** Period totals (definitions shared with M12 reports via lib/salesSummary). */
export function HistorySummary({ summary }: { summary: SalesSummary }) {
  return (
    <div className="grid grid-cols-3 gap-2 md:grid-cols-4 md:gap-3">
      <Stat label="Penjualan bersih" value={formatRupiah(summary.netSales)} hint={`Kotor ${formatRupiah(summary.grossSales)}`} isPrimary />
      <Stat label="Transaksi" value={String(summary.transactions)} hint={summary.voidCount > 0 ? `${summary.voidCount} void` : 'Tanpa void'} />
      <Stat label="Rata-rata" value={formatRupiah(summary.averageTicket)} hint="per transaksi" />
      <Stat label="Refund" value={formatRupiah(summary.refunds)} hint={summary.refunds > 0 ? 'dikurangi dari penjualan' : 'Tidak ada refund'} />
    </div>
  );
}
