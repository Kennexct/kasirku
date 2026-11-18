import { CalendarRange } from 'lucide-react';
import { SearchInput } from '../../components/ui/SearchInput';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Select } from '../../components/ui/Select';
import { inputBase } from '../../components/ui/styles';
import { ORDER_STATUS_LABEL } from '../../constants';
import type { DateRange, RangePreset } from '../../lib/dateRange';
import type { Id, OrderStatus, PaymentMethod, SalesMode } from '../../types';

export interface HistoryFilter {
  status: 'all' | OrderStatus;
  paymentMethodId: 'all' | Id;
  salesModeId: 'all' | Id;
  query: string;
}

export const EMPTY_FILTER: HistoryFilter = { status: 'all', paymentMethodId: 'all', salesModeId: 'all', query: '' };

const PRESET_OPTIONS: ReadonlyArray<{ value: RangePreset; label: string }> = [
  { value: 'today', label: 'Hari ini' },
  { value: 'yesterday', label: 'Kemarin' },
  { value: 'last7', label: '7 hari' },
  { value: 'month', label: 'Bulan ini' },
  { value: 'custom', label: 'Pilih tanggal' },
];

const STATUS_FILTERS: ReadonlyArray<OrderStatus> = ['paid', 'partial_refund', 'refunded', 'void', 'cancelled'];

interface HistoryFiltersProps {
  preset: RangePreset;
  onPresetChange: (preset: RangePreset) => void;
  customRange: DateRange;
  onCustomRangeChange: (range: DateRange) => void;
  rangeError: string | null;
  today: string;
  filter: HistoryFilter;
  onFilterChange: (filter: HistoryFilter) => void;
  paymentMethods: PaymentMethod[];
  salesModes: SalesMode[];
}

export function HistoryFilters(props: HistoryFiltersProps) {
  const { preset, onPresetChange, customRange, onCustomRangeChange, rangeError, today, filter, onFilterChange, paymentMethods, salesModes } = props;
  const set = (patch: Partial<HistoryFilter>) => onFilterChange({ ...filter, ...patch });
  const hasFilters = filter.status !== 'all' || filter.paymentMethodId !== 'all' || filter.salesModeId !== 'all' || filter.query !== '';

  return (
    <div className="flex flex-col gap-3 pb-3">
      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0">
        <SegmentedControl label="Periode" options={PRESET_OPTIONS} value={preset} onChange={onPresetChange} />
      </div>

      {preset === 'custom' && (
        <div className="flex flex-wrap items-end gap-2">
          <CalendarRange aria-hidden size={18} className="mb-3.5 text-muted" />
          <label className="flex flex-col text-[13px] font-semibold text-ink-soft">
            Dari
            <input type="date" value={customRange.from} max={today} onChange={(e) => onCustomRangeChange({ ...customRange, from: e.target.value })} className={`${inputBase} num mt-1 h-11 w-[170px]`} />
          </label>
          <label className="flex flex-col text-[13px] font-semibold text-ink-soft">
            Sampai
            <input type="date" value={customRange.to} max={today} onChange={(e) => onCustomRangeChange({ ...customRange, to: e.target.value })} className={`${inputBase} num mt-1 h-11 w-[170px]`} />
          </label>
          {rangeError && <p role="alert" className="mb-3 text-[13px] text-danger-700">{rangeError}</p>}
        </div>
      )}

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="lg:max-w-xs lg:flex-1">
          <SearchInput value={filter.query} onChange={(query) => set({ query })} placeholder="No. struk atau label…" label="Cari transaksi" />
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0">
          <Select
            label="Status"
            value={filter.status}
            isActive={filter.status !== 'all'}
            onChange={(status) => set({ status: status as HistoryFilter['status'] })}
            options={[{ value: 'all', label: 'Semua status' }, ...STATUS_FILTERS.map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s] }))]}
          />
          <Select
            label="Metode pembayaran"
            value={filter.paymentMethodId}
            isActive={filter.paymentMethodId !== 'all'}
            onChange={(paymentMethodId) => set({ paymentMethodId })}
            options={[{ value: 'all', label: 'Semua metode' }, ...paymentMethods.map((m) => ({ value: m.id, label: m.name }))]}
          />
          <Select
            label="Mode penjualan"
            value={filter.salesModeId}
            isActive={filter.salesModeId !== 'all'}
            onChange={(salesModeId) => set({ salesModeId })}
            options={[{ value: 'all', label: 'Semua mode' }, ...salesModes.map((m) => ({ value: m.id, label: m.name }))]}
          />
          {hasFilters && (
            <button type="button" onClick={() => onFilterChange(EMPTY_FILTER)} className="h-11 shrink-0 rounded-lg px-3 text-[14px] font-semibold text-brand-700 hover:bg-brand-50">
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
