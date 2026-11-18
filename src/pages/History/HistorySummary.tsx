import { StatTile } from '../../components/ui/StatTile';
import { formatRupiah } from '../../lib/money';
import type { ReportSummary } from '../../lib/reports';

/** Period totals — definitions from lib/reports.ts (shared with Reports, ADR-002 cash basis). */
export function HistorySummary({ summary }: { summary: ReportSummary }) {
  return (
    <div className="grid grid-cols-3 gap-2 md:grid-cols-4 md:gap-3">
      <StatTile label="Penjualan bersih" value={formatRupiah(summary.netSales)} hint={`Kotor ${formatRupiah(summary.grossSales)}`} isPrimary />
      <StatTile label="Transaksi" value={String(summary.transactions)} hint={summary.voidCount > 0 ? `${summary.voidCount} void` : 'Tanpa void'} />
      <StatTile label="Rata-rata" value={formatRupiah(summary.averageTicket)} hint="per transaksi" />
      <StatTile label="Refund" value={formatRupiah(summary.refunds)} hint={summary.refunds > 0 ? 'refund di periode ini' : 'Tidak ada refund'} />
    </div>
  );
}
