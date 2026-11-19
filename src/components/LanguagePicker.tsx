import { LANGUAGES, lang, setLanguage } from '../i18n';
import { option } from './ui/styles';

/** Two buttons, each in its own language. Choosing the other one saves it and reloads the app (ADR-010). */
export function LanguagePicker({ isCompact = false }: { isCompact?: boolean }) {
  return (
    <div role="radiogroup" aria-label="Bahasa / Language" className={`grid grid-cols-2 gap-2 ${isCompact ? 'max-w-xs' : ''}`}>
      {LANGUAGES.map(({ value, label }) => (
        <button key={value} type="button" role="radio" lang={value} aria-checked={lang === value} onClick={() => setLanguage(value)} className={`${option(lang === value)} ${isCompact ? 'h-10 text-[13px]' : 'h-12 text-[14px] sm:text-[15px]'} whitespace-nowrap px-2`}>
          {label}
        </button>
      ))}
    </div>
  );
}
