import { Search, X } from 'lucide-react';
import { t } from '../../i18n';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}

export function SearchInput({ value, onChange, placeholder, label }: SearchInputProps) {
  return (
    <div className="relative min-w-0 flex-1">
      <Search aria-hidden size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
      <input
        type="search"
        aria-label={label}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-lg border border-line bg-subtle pl-10 pr-10 text-[15px] text-ink outline-none transition-[background-color,box-shadow] focus:border-brand-600 focus:bg-surface focus:ring-[3px] focus:ring-brand-600/15 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          aria-label={t('Hapus pencarian')}
          onClick={() => onChange('')}
          className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:bg-line"
        >
          <X aria-hidden size={16} />
        </button>
      )}
    </div>
  );
}
