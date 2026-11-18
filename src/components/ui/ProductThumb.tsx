interface ProductThumbProps {
  name: string;
  photoUrl?: string;
  className?: string;
}

function monogram(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Product photo, or a quiet neutral monogram when there is none (PRD M3).
 * Deliberately monochrome: the photo — not random pastel colors — should be the only color on a tile.
 */
export function ProductThumb({ name, photoUrl, className = '' }: ProductThumbProps) {
  if (photoUrl) {
    return <img src={photoUrl} alt="" loading="lazy" className={`bg-subtle object-cover ${className}`} />;
  }
  return (
    <div
      aria-hidden
      className={`flex items-center justify-center bg-subtle bg-[radial-gradient(var(--color-line)_1px,transparent_1px)] [background-size:10px_10px] ${className}`}
    >
      <span className="rounded-md bg-surface px-2 py-1 text-[15px] font-bold tracking-[-0.02em] text-muted ring-1 ring-line">
        {monogram(name)}
      </span>
    </div>
  );
}
