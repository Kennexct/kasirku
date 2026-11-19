import { StatTile } from '../../components/ui/StatTile';
import { formatRupiah } from '../../lib/money';
import type { ReportSummary } from '../../lib/reports';
import { t } from '../../i18n';

/** Period totals — definitions from lib/reports.ts (shared with Reports, ADR-002 cash basis). */
export function HistorySummary({ summary }: { summary: ReportSummary }) {
  return (
    <div className="grid grid-cols-3 gap-2 md:grid-cols-4 md:gap-3">
      <StatTile label={t('Penjualan bersih')} value={formatRupiah(summary.netSales)} hint={t('Kotor {0}', formatRupiah(summary.grossSales))} isPrimary />
      <StatTile label={t('Transaksi')} value={String(summary.transactions)} hint={summary.voidCount > 0 ? t('{0} void', summary.voidCount) : t('Tanpa void')} />
      <StatTile label={t('Rata-rata')} value={formatRupiah(summary.averageTicket)} hint={t('per transaksi')} />
      <StatTile label={t('Refund')} value={formatRupiah(summary.refunds)} hint={summary.refunds > 0 ? t('refund di periode ini') : t('Tidak ada refund')} />
    </div>
  );
}
