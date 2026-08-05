import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

interface Props {
  /** When given, renders a titled <section>; otherwise a plain white card. */
  title?: string;
  /** Optional control shown on the right of the title row (e.g. a "clear" button). */
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** The white card used across pages — every block on the grey background uses it. */
export function SectionCard({ title, action, className, children }: Props) {
  return (
    <section
      className={cn('rounded-card border border-line/60 bg-card p-4 shadow-card', className)}
    >
      {title && (
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-extrabold tracking-tight">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
