import { LOCALE } from '../../constants';
import { parseRupiah } from '../../lib/money';
import { inputBase } from './styles';

interface RupiahInputProps {
  id?: string;
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  autoFocus?: boolean;
  ariaLabel?: string;
  size?: 'md' | 'lg';
}

const groupFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });

/** Numeric keypad input that shows thousand separators ("12.500") and emits integer Rupiah. */
export function RupiahInput({ id, value, onChange, placeholder = '0', autoFocus, ariaLabel, size = 'md' }: RupiahInputProps) {
  const sizeClass = size === 'lg' ? 'h-14 text-[22px] font-bold' : 'font-semibold';
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-[14px] font-semibold text-muted">Rp</span>
      <input
        id={id}
        aria-label={ariaLabel}
        inputMode="numeric"
        autoComplete="off"
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={value === null ? '' : groupFormatter.format(value)}
        onChange={(event) => onChange(parseRupiah(event.target.value))}
        className={`${inputBase} num pl-11 text-right ${sizeClass}`}
      />
    </div>
  );
}
