import { describe, expect, it } from 'vitest';
import { niceTicks } from './niceTicks';

describe('niceTicks', () => {
  it('produces round steps that cover the max', () => {
    expect(niceTicks(22_000)).toEqual([0, 10_000, 20_000, 30_000]);
    expect(niceTicks(18_000)).toEqual([0, 5_000, 10_000, 15_000, 20_000]);
    expect(niceTicks(1_250_000)).toEqual([0, 500_000, 1_000_000, 1_500_000]);
    expect(niceTicks(7)).toEqual([0, 2, 4, 6, 8]);
  });

  it('handles empty data', () => {
    expect(niceTicks(0)).toEqual([0, 1]);
  });
});
