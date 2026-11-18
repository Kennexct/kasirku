import { useState } from 'react';
import { MAX_EXPORT_RANGE_DAYS } from '../constants';
import { presetRange, validateRange, type DateRange, type RangePreset } from '../lib/dateRange';
import type { BusinessDate } from '../types';

export interface DateRangeState {
  preset: RangePreset;
  setPreset: (preset: RangePreset) => void;
  customRange: DateRange;
  setCustomRange: (range: DateRange) => void;
  /** Effective range; falls back to today while a custom range is invalid. */
  range: DateRange;
  rangeError: string | null;
}

/** Period selection shared by History and Reports (same presets, same 366-day limit). */
export function useDateRange(today: BusinessDate, initial: RangePreset = 'today'): DateRangeState {
  const [preset, setPreset] = useState<RangePreset>(initial);
  const [customRange, setCustomRange] = useState<DateRange>({ from: today, to: today });
  const rangeError = preset === 'custom' ? validateRange(customRange, MAX_EXPORT_RANGE_DAYS) : null;
  const range: DateRange =
    preset === 'custom' ? (rangeError ? { from: today, to: today } : customRange) : presetRange(preset, today);
  return { preset, setPreset, customRange, setCustomRange, range, rangeError };
}
