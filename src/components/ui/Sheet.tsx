import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

interface SheetProps {
  title: string;
  /** Secondary line under the title (order no., context). */
  subtitle?: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /** Wider panel on tablet (forms with two columns). */
  isWide?: boolean;
  /** Content manages its own padding and scrolling (e.g. the cart). */
  isFlush?: boolean;
}

/** Bottom sheet with grabber on phone, centered dialog on tablet. Closes on backdrop tap or Escape. */
export function Sheet({ title, subtitle, isOpen, onClose, children, footer, isWide = false, isFlush = false }: SheetProps) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="presentation"
      onClick={onClose}
      className="animate-fade fixed inset-0 z-40 flex items-end justify-center bg-ink/40 backdrop-blur-[2px] md:items-center md:p-6"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className={`animate-sheet flex max-h-[92dvh] w-full flex-col rounded-t-xl bg-surface shadow-pop md:rounded-xl ${
          isWide ? 'md:max-w-2xl' : 'md:max-w-[440px]'
        }`}
      >
        <div aria-hidden className="mx-auto mt-2 h-1 w-9 rounded-full bg-line-strong md:hidden" />
        <header className="flex items-start gap-3 px-5 pb-3 pt-3 md:pt-4">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[17px] font-bold tracking-[-0.01em] text-ink">{title}</h2>
            {subtitle && <p className="num truncate text-[13px] text-muted">{subtitle}</p>}
          </div>
          <button
            type="button"
            aria-label="Tutup"
            onClick={onClose}
            className="-mr-2 -mt-1 flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-subtle hover:text-ink"
          >
            <X aria-hidden size={20} />
          </button>
        </header>
        <div className={isFlush ? 'flex min-h-0 flex-1 flex-col border-t border-line' : 'flex-1 overflow-y-auto border-t border-line px-5 py-4'}>
          {children}
        </div>
        {footer && (
          <footer className="border-t border-line px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</footer>
        )}
      </div>
    </div>
  );
}
