import { describeDifference } from '../../lib/cashDrawer';

/** Counted − expected, in words: "Pas", "Kurang Rp5.000", "Lebih Rp2.000". Colour is backed by the word. */
export function DifferenceBadge({ difference }: { difference: number }) {
  const tone = difference === 0 ? 'bg-brand-50 text-brand-700' : difference < 0 ? 'bg-danger-50 text-danger-700' : 'bg-warn-50 text-warn-700';
  const text = describeDifference(difference);
  return <span className={`num inline-flex h-6 items-center rounded-md px-2 text-[12px] font-semibold ${tone}`}>{text.charAt(0).toUpperCase() + text.slice(1)}</span>;
}
