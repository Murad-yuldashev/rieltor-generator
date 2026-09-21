import { Link } from 'react-router';
import { formatListedAt, type PresentationSummary } from '@rieltor/shared';
import { telegramShareUrl } from '@/features/presentations';
import { Icon } from '@/shared/ui/icon';

/**
 * One presentation in the list grid — a `flex flex-col` card so it fills the grid
 * cell; `flex-1` on the link body pins the copy/Telegram footer to the bottom so
 * neighbouring cards align. The link opens the analytics detail; the footer lets a
 * presentation be re-forwarded (copy link / Telegram) without opening it.
 */
export function PresentationCard({
  presentation,
  copied,
  onCopy,
}: {
  presentation: PresentationSummary;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <article className="flex flex-col rounded-card bg-card p-4 shadow-card">
      <Link to={`/presentations/${presentation.id}`} className="flex flex-1 items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Icon name="share" className="size-5" strokeWidth={2.2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-ink">
            {presentation.title}
          </span>
          {presentation.clientLabel && (
            <span className="mt-0.5 block truncate text-[13px] font-medium text-ink-2">
              {presentation.clientLabel}
            </span>
          )}
          <span className="mt-1 flex items-center gap-2 text-[13px] font-medium text-ink-2">
            <span className="inline-flex items-center gap-1">
              <Icon name="eye" className="size-3.5 text-ink-3" strokeWidth={2.2} />
              {presentation.opensCount} ochilish
            </span>
            <span className="text-ink-3">·</span>
            <span>{formatListedAt(presentation.createdAt.slice(0, 10))}</span>
          </span>
        </span>
        <Icon name="chevronRight" className="size-5 shrink-0 text-ink-3" />
      </Link>

      <div className="mt-3 flex gap-2 border-t border-line pt-3">
        <button
          type="button"
          onClick={onCopy}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-line bg-surface px-3 py-2.5 text-[13px] font-bold text-ink-2"
        >
          <Icon name={copied ? 'check' : 'doc'} className="size-4" strokeWidth={2.2} />
          {copied ? 'Nusxa olindi' : 'Nusxa olish'}
        </button>
        <a
          href={telegramShareUrl(presentation.url, presentation.title)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-accent px-3 py-2.5 text-[13px] font-bold text-white"
        >
          <Icon name="telegram" className="size-4" />
          Telegramda
        </a>
      </div>
    </article>
  );
}
