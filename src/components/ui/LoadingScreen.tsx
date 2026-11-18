import { LogoMark } from '../Brand/Logo';

export function LoadingScreen({ message = 'Memuat…' }: { message?: string }) {
  return (
    <div role="status" className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-[14px] text-muted">
      <span className="animate-pulse">
        <LogoMark size={36} />
      </span>
      {message}
    </div>
  );
}
