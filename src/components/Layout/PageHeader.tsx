import type { ReactNode } from 'react';
import { pageTitle } from '../ui/styles';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Tabs or filters rendered flush with the bottom border. */
  children?: ReactNode;
}

/** Consistent page header for every non-POS screen. */
export function PageHeader({ title, description, actions, children }: PageHeaderProps) {
  return (
    <header className="border-b border-line bg-surface px-4 pt-4 md:px-8 md:pt-6">
      <div className={`flex items-start gap-3 ${children ? 'pb-3' : 'pb-4 md:pb-6'}`}>
        <div className="min-w-0 flex-1">
          <h1 className={pageTitle}>{title}</h1>
          {description && <p className="mt-0.5 text-[14px] text-muted">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </header>
  );
}
