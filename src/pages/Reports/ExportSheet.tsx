import { Download, FileSpreadsheet, FileText, Share2, Table2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Sheet } from '../../components/ui/Sheet';
import { btnPrimary, btnSecondary, labelBase, option } from '../../components/ui/styles';
import { formatRange } from '../../lib/dateRange';
import { DATASETS, DATASET_LABEL, type Dataset, type ExportContext } from '../../lib/export/columns';
import { canShareFiles, downloadBlob, shareBlob } from '../../lib/export/deliver';
import { buildExport, exportFileName, type ExportFormat } from '../../lib/export/index';
import type { Report } from '../../lib/reports';
import { t } from '../../i18n';

const FORMATS: ReadonlyArray<{ value: ExportFormat; label: string; hint: string; icon: LucideIcon }> = [
  { value: 'xlsx', label: t('Excel'), hint: t('Ringkasan + semua data, angka bisa dijumlah'), icon: FileSpreadsheet },
  { value: 'pdf', label: t('PDF'), hint: t('Ringkasan siap kirim / cetak'), icon: FileText },
  { value: 'csv', label: t('CSV'), hint: t('Satu tabel data mentah'), icon: Table2 },
];

interface ExportSheetProps {
  storeName: string;
  report: Report;
  ctx: ExportContext;
  onClose: () => void;
}

export function ExportSheet({ storeName, report, ctx, onClose }: ExportSheetProps) {
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [dataset, setDataset] = useState<Dataset>('transactions');
  const [isBusy, setIsBusy] = useState(false);
  const isShareable = canShareFiles();

  const run = async (mode: 'download' | 'share') => {
    setIsBusy(true);
    try {
      const blob = await buildExport({ format, dataset, storeName, report, ctx });
      const fileName = exportFileName({ format, dataset, storeName, report });
      if (mode === 'share') {
        const isShared = await shareBlob(blob, fileName, t('Laporan {0}', storeName));
        if (isShared) toast.success(t('File dibagikan'));
      } else {
        downloadBlob(blob, fileName);
        toast.success(t('{0} diunduh', fileName));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Gagal membuat file.'));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <Sheet
      title={t('Ekspor laporan')}
      subtitle={formatRange(report.range)}
      isOpen
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          {isShareable && (
            <button type="button" disabled={isBusy} onClick={() => void run('share')} className={btnSecondary}>
              <Share2 aria-hidden size={18} /> {t('Bagikan')}
            </button>
          )}
          <button type="button" disabled={isBusy} onClick={() => void run('download')} className={`${btnPrimary} flex-1`}>
            <Download aria-hidden size={18} /> {isBusy ? t('Membuat file…') : t('Unduh')}
          </button>
        </div>
      }
    >
      <p className={labelBase}>{t('Format')}</p>
      <div className="grid gap-2" role="radiogroup" aria-label={t('Format file')}>
        {FORMATS.map(({ value, label, hint, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={format === value}
            onClick={() => setFormat(value)}
            className={`${option(format === value)} justify-start! gap-3 py-3 text-left`}
          >
            <Icon aria-hidden size={22} className="shrink-0" />
            <span>
              <span className="block font-semibold">{label}</span>
              <span className="block text-[13px] font-normal opacity-80">{hint}</span>
            </span>
          </button>
        ))}
      </div>

      {format === 'csv' && (
        <div className="mt-4">
          <p className={labelBase}>{t('Data')}</p>
          <SegmentedControl label={t('Data CSV')} isFullWidth options={DATASETS.map((d) => ({ value: d, label: DATASET_LABEL[d] }))} value={dataset} onChange={setDataset} />
        </div>
      )}

      <p className="mt-4 text-[13px] text-muted">
        {t('Berisi')} {report.summary.transactions} {t('transaksi dari perangkat ini. Refund dihitung pada tanggal refund dilakukan.')}
      </p>
    </Sheet>
  );
}
