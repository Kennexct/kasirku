interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  isFullWidth?: boolean;
}

/** iOS/Linear-style segmented control for mutually exclusive modes (sales mode, discount type). */
export function SegmentedControl<T extends string>({ label, options, value, onChange, isFullWidth = false }: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`inline-flex h-11 shrink-0 gap-0.5 rounded-lg bg-subtle p-1 ring-1 ring-inset ring-line ${isFullWidth ? 'w-full' : ''}`}
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(opt.value)}
            className={`${isFullWidth ? 'min-w-0 flex-1 truncate' : 'flex-none whitespace-nowrap'} rounded-md px-3.5 text-[14px] font-semibold transition-[background-color,color,box-shadow] duration-150 ${
              isActive ? 'bg-surface text-ink shadow-xs ring-1 ring-line' : 'text-muted hover:text-ink'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
