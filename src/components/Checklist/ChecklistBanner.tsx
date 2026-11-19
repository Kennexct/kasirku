import { ListChecks, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { dismissChecklistBanner, type ChecklistState } from '../../hooks/useChecklist';

/** One slim row above the menu on new installs: progress + the next step. Never blocks selling. */
export function ChecklistBanner({ checklist }: { checklist: ChecklistState }) {
  const next = checklist.items.find((item) => !item.isDone);
  if (!checklist.shouldShowBanner || !next) return null;
  return (
    <div className="flex items-center gap-2 border-b border-brand-200 bg-brand-50 py-1 pl-3 pr-1 text-[13px] text-brand-800 md:pl-5">
      <ListChecks aria-hidden size={17} className="shrink-0" />
      <Link to={ROUTES.help} className="min-w-0 flex-1 truncate py-2">
        <span className="num font-semibold">Langkah awal {checklist.done}/{checklist.total}</span>
        <span className="text-brand-700"> · Berikutnya: {next.label}</span>
      </Link>
      <button type="button" aria-label="Sembunyikan langkah awal" onClick={() => void dismissChecklistBanner()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-brand-700 hover:bg-brand-100">
        <X aria-hidden size={17} />
      </button>
    </div>
  );
}
