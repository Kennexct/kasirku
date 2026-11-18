const NICE_STEPS = [1, 2, 2.5, 5, 10] as const;

/**
 * Clean axis ticks from 0 to just above `max` (dataviz spec: round numbers — 0/5K/10K, never 5.5K).
 * Returns `count`+1-ish ticks whose step is 1, 2, 2.5 or 5 × 10^n.
 */
export function niceTicks(max: number, count = 4): number[] {
  if (!Number.isFinite(max) || max <= 0) return [0, 1];
  const raw = max / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = (NICE_STEPS.find((s) => s * magnitude >= raw) ?? 10) * magnitude;
  const top = Math.ceil(max / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => Math.round(i * step));
}
