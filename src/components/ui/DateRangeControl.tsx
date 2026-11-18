import { CalendarRange } from 'lucide-react';
import type { DateRangeState } from '../../hooks/useDateRange';
import type { RangePreset } from '../../lib/dateRange';
import { SegmentedControl } from './SegmentedControl';
import { inputBase } from './styles';

const PRESET_OPTIONS: ReadonlyArray<{ value: RangePreset; label: string }> = [
  { value: 'today', label: 'Hari ini' },
  { value: 'yesterday', label: 'Kemarin' },
  { value: 'last7', label: '7 hari' },
  { value: 'month', label: 'Bulan ini' },
  { value: 'custom', label: 'Pilih tanggal' },
];

interface DateRangeControlProps {
  state: DateRangeState;
  today: string;
}

export function DateRangeControl({ state, today }: DateRangeControlProps) {
  const { preset, setPreset, customRange, setCustomRange, rangeError } = state;
  return (
    <div className="flex flex-col gap-3">
      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0">
        <SegmentedControl label="Periode" options={PRESET_OPTIONS} value={preset} onChange={setPreset} />
      </div>
      {preset === 'custom' && (
        <div className="flex flex-wrap items-end gap-2">
          <CalendarRange aria-hidden size={18} className="mb-3.5 text-muted" />
          <label className="flex flex-col text-[13px] font-semibold text-ink-soft">
            Dari
            <input type="date" value={customRange.from} max={today} onChange={(e) => setCustomRange({ ...customRange, from: e.target.value })} className={`${inputBase} num mt-1 h-11 w-[170px]`} />
          </label>
          <label className="flex flex-col text-[13px] font-semibold text-ink-soft">
            Sampai
            <input type="date" value={customRange.to} max={today} onChange={(e) => setCustomRange({ ...customRange, to: e.target.value })} className={`${inputBase} num mt-1 h-11 w-[170px]`} />
          </label>
          {rangeError && <p role="alert" className="mb-3 text-[13px] text-danger-700">{rangeError}</p>}
        </div>
      )}
    </div>
  );
}
