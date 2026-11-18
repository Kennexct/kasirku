import { describe, expect, it } from 'vitest';
import { addDays, datesInRange, daysBetween, presetRange, validateRange } from './dateRange';

describe('dateRange', () => {
  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('counts days between dates', () => {
    expect(daysBetween('2026-11-18', '2026-11-25')).toBe(7);
    expect(daysBetween('2026-11-18', '2026-11-11')).toBe(-7);
  });

  it('builds presets from the business date', () => {
    expect(presetRange('today', '2026-11-18')).toEqual({ from: '2026-11-18', to: '2026-11-18' });
    expect(presetRange('yesterday', '2026-11-01')).toEqual({ from: '2026-10-31', to: '2026-10-31' });
    expect(presetRange('last7', '2026-11-18')).toEqual({ from: '2026-11-12', to: '2026-11-18' });
    expect(presetRange('month', '2026-11-18')).toEqual({ from: '2026-11-01', to: '2026-11-18' });
  });

  it('validates order and maximum span', () => {
    expect(validateRange({ from: '2026-11-18', to: '2026-11-01' }, 366)).toMatch(/sebelum/);
    expect(validateRange({ from: '2025-01-01', to: '2026-11-18' }, 366)).toMatch(/maksimal 366/);
    expect(validateRange({ from: '2026-01-01', to: '2026-12-31' }, 366)).toBeNull();
  });

  it('lists dates newest first', () => {
    expect(datesInRange({ from: '2026-11-16', to: '2026-11-18' })).toEqual(['2026-11-18', '2026-11-17', '2026-11-16']);
  });
});
