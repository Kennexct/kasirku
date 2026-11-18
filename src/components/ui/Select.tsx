import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  /** Visually highlight when a filter is applied (value !== first option). */
  isActive?: boolean;
}

/** Native select (best on mobile: OS picker) styled as a compact filter control. */
export function Select({ label, value, options, onChange, isActive = false }: SelectProps) {
  return (
    <div className="relative shrink-0">
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`h-11 appearance-none rounded-lg border pl-3.5 pr-9 text-[14px] font-semibold outline-none transition-colors focus:ring-[3px] focus:ring-brand-600/15 ${
          isActive ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-line-strong bg-surface text-ink-soft hover:bg-subtle'
        }`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
    </div>
  );
}
