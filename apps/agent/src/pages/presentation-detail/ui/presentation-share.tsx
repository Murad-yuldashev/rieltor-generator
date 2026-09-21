import { telegramShareUrl } from '@/features/presentations';
import { Icon } from '@/shared/ui/icon';
import { cn } from '@/shared/lib/cn';

/**
 * Aside share card — the public presentation link with a copy button (confirming
 * with "Nusxa olindi") and a Telegram share anchor. Purely presentational: the
 * copy state and handler live on the detail page.
 */
export function PresentationShare({
  url,
  title,
  copied,
  onCopy,
  className,
}: {
  url: string;
  title: string;
  copied: boolean;
  onCopy: () => void;
  className?: string;
}) {
  return (
    <section className={cn('rounded-card bg-card p-4 shadow-card', className)}>
      <p className="text-[12px] font-bold text-ink-2">Ommaviy havola</p>
      <p className="mt-1 truncate text-[13px] font-medium text-accent-dark">{url}</p>
      <div className="mt-2.5 flex gap-2">
        <button
          type="button"
          onClick={onCopy}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-line bg-surface px-3 py-2.5 text-[13px] font-bold text-ink-2"
        >
          <Icon name={copied ? 'check' : 'doc'} className="size-4" strokeWidth={2.2} />
          {copied ? 'Nusxa olindi' : 'Nusxa olish'}
        </button>
        <a
          href={telegramShareUrl(url, title)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-accent px-3 py-2.5 text-[13px] font-bold text-white"
        >
          <Icon name="telegram" className="size-4" />
          Telegramda ulashish
        </a>
      </div>
    </section>
  );
}
