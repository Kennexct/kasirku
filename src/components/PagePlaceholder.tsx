import { Hammer } from 'lucide-react';
import { PageHeader } from './Layout/PageHeader';
import { EmptyState } from './ui/EmptyState';

interface PagePlaceholderProps {
  title: string;
  prdRef: string;
  description: string;
}

/** Temporary page body until the module is built; links each route to its PRD module. */
export function PagePlaceholder({ title, prdRef, description }: PagePlaceholderProps) {
  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <PageHeader title={title} description={description} />
      <EmptyState icon={Hammer} title="Segera hadir" description={`Modul ini sedang dibangun (PRD ${prdRef}).`} />
    </section>
  );
}
