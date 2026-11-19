import type { ReactNode } from 'react';
import type { HelpTopicId } from '../../content/help';
import { HelpButton } from '../Help/HelpButton';
import { pageTitle } from '../ui/styles';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Shows a "?" that opens this help topic in a sheet. */
  helpTopic?: HelpTopicId;
  /** Tabs or filters rendered flush with the bottom border. */
  children?: ReactNode;
}

/** Consistent page header for every non-POS screen. */
export function PageHeader({ title, description, actions, helpTopic, children }: PageHeaderProps) {
  return (
    <header className="border-b border-line bg-surface px-4 pt-4 md:px-8 md:pt-6">
      <div className={`flex items-start gap-3 ${children ? 'pb-3' : 'pb-4 md:pb-6'}`}>
        <div className="min-w-0 flex-1">
          <h1 className={pageTitle}>{title}</h1>
          {description && <p className="mt-0.5 text-[14px] text-muted">{description}</p>}
        </div>
        {helpTopic && <HelpButton topic={helpTopic} />}
        {actions}
      </div>
      {children}
    </header>
  );
}
