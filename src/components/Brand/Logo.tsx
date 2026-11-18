interface LogoProps {
  size?: number;
  withWordmark?: boolean;
}

/** Receipt logomark: a slip with a torn edge — the one thing every sale produces. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="8" fill="var(--color-brand-600)" />
      <path
        d="M10 7.5h12a1 1 0 0 1 1 1V24l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5V8.5a1 1 0 0 1 1-1Z"
        fill="#fff"
      />
      <rect x="12" y="11" width="8" height="1.8" rx=".9" fill="var(--color-brand-600)" />
      <rect x="12" y="14.6" width="5.5" height="1.8" rx=".9" fill="var(--color-brand-300)" />
      <rect x="12" y="18.2" width="8" height="1.8" rx=".9" fill="var(--color-brand-600)" />
    </svg>
  );
}

export function Logo({ size = 32, withWordmark = true }: LogoProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={size} />
      {withWordmark && (
        <span className="text-[17px] font-bold tracking-[-0.02em] text-ink">
          Kasir<span className="text-brand-600">Ku</span>
        </span>
      )}
    </span>
  );
}
