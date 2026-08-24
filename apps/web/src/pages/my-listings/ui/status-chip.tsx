import { cn } from '@/shared/lib/cn';
import type { MyListingStatus } from '../model/use-my-listings';

const STATUS_META: Record<MyListingStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Qoralama', className: 'bg-ink-3/10 text-ink-2' },
  MODERATION: { label: 'Moderatsiyada', className: 'bg-brand-amber/10 text-brand-amber' },
  PUBLISHED: { label: 'Chop etilgan', className: 'bg-brand-green/10 text-brand-green' },
  REJECTED: { label: 'Rad etilgan', className: 'bg-brand-rose/10 text-brand-rose' },
  // Not reachable from the current wizard/moderation flow, but the Prisma enum
  // has it — rendering a labelled grey chip beats an unhandled-status crash.
  ARCHIVED: { label: 'Arxivlangan', className: 'bg-ink-3/10 text-ink-2' },
};

interface Props {
  status: MyListingStatus;
  /** Shown as a native tooltip on REJECTED — the reason also renders inline below the title. */
  rejectionReason?: string | null;
}

export function StatusChip({ status, rejectionReason }: Props) {
  const meta = STATUS_META[status];

  return (
    <span
      title={status === 'REJECTED' ? (rejectionReason ?? undefined) : undefined}
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11.5px] font-extrabold tracking-wide',
        meta.className,
      )}
    >
      {meta.label}
    </span>
  );
}
