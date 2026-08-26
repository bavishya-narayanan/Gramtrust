import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between', className)}>
      <div className="max-w-3xl space-y-3">
        {eyebrow ? <p className="section-title text-blue-700">{eyebrow}</p> : null}
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-950 sm:text-4xl">{title}</h1>
          <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">{description}</p>
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}
