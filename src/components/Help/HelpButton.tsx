import { CircleHelp } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { helpTopic, type HelpTopicId } from '../../content/help';
import { Sheet } from '../ui/Sheet';
import { btnGhost, btnIcon } from '../ui/styles';
import { HelpTopicView } from './HelpTopicView';

/** "?" in a page header: opens the matching help topic in a sheet, so the merchant never leaves the screen. */
export function HelpButton({ topic: topicId }: { topic: HelpTopicId }) {
  const [isOpen, setIsOpen] = useState(false);
  const topic = helpTopic(topicId);
  return (
    <>
      <button type="button" aria-label="Bantuan untuk halaman ini" title="Bantuan" onClick={() => setIsOpen(true)} className={`${btnIcon} border-transparent! bg-transparent! text-muted`}>
        <CircleHelp aria-hidden size={21} />
      </button>
      {isOpen && (
        <Sheet
          title={topic.title}
          subtitle="Bantuan"
          isOpen
          onClose={() => setIsOpen(false)}
          footer={
            <Link to={ROUTES.help} onClick={() => setIsOpen(false)} className={`${btnGhost} w-full text-[14px]`}>
              Lihat semua topik bantuan
            </Link>
          }
        >
          <HelpTopicView topic={topic} />
        </Sheet>
      )}
    </>
  );
}
