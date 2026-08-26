import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

/** Minimal shared heading; the cabinet reuses the web app's visual language. */
export function PageHeading({ children, className }: { children: ReactNode; className?: string }) {
  return <h1 className={cn('text-xl font-semibold text-ink', className)}>{children}</h1>;
}
