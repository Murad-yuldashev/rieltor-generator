import { useState } from 'react';
import { Link } from 'react-router';
import { formatListedAt, type PresentationSummary } from '@rieltor/shared';
import { telegramShareUrl, usePresentations } from '@/features/presentations';
import { Icon } from '@/shared/ui/icon';

/**
 * "Mening taqdimotlarim" — the realtor's shared presentations
 * (`GET /api/agent/presentations`, newest first). Each card links to its
 * analytics detail and carries a per-row copy-link + Telegram-share action so a
 * presentation can be re-forwarded without opening it.
 */
export function PresentationsPage() {
  const { data: presentations, isPending, isError } = usePresentations();

  // Which card most recently had its link copied — drives the "Nusxa olindi"
  // confirmation on that row only.
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleCopy(presentation: PresentationSummary) {
    try {
      await navigator.clipboard.writeText(presentation.url);
      setCopiedId(presentation.id);
      window.setTimeout(() => setCopiedId((id) => (id === presentation.id ? null : id)), 2000);
    } catch {
      // Clipboard unavailable (insecure context / denied) — the link is still reachable in the detail page.
    }
  }

  return (
    <main className="mx-auto min-h-dvh max-w-content bg-surface px-4 py-6">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1 text-[13px] font-semibold text-ink-2"
      >
        <Icon name="chevronLeft" className="size-4" />
        Kabinetga qaytish
      </Link>

      <header className="mb-5">
        <p className="text-[13px] font-semibold text-ink-2">Rieltor kabineti</p>
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink">Mening taqdimotlarim</h1>
      </header>

      {isPending ? (
        <p className="text-[15px] font-semibold text-ink-2">Yuklanmoqda...</p>
      ) : isError ? (
        <p className="rounded-card bg-card p-4 text-[14px] font-semibold text-brand-rose shadow-card">
          Taqdimotlarni yuklab bo'lmadi. Sahifani yangilang.
        </p>
      ) : !presentations || presentations.length === 0 ? (
        <div className="rounded-card bg-card p-8 text-center shadow-card">
          <p className="text-[15px] font-bold text-ink">Hali taqdimot yo'q</p>
          <p className="mt-1 text-[13px] font-medium text-ink-2">
            Kolleksiyadan taqdimot yaratib, mijozlarga ulashing.
          </p>
          <Link
            to="/collections"
            className="mt-4 inline-flex items-center gap-1.5 rounded-[12px] bg-accent-soft px-4 py-2.5 text-[13px] font-bold text-accent-dark"
          >
            <Icon name="heart" className="size-4" />
            Kolleksiyalarim
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {presentations.map((presentation) => (
            <article key={presentation.id} className="rounded-card bg-card p-4 shadow-card">
              <Link to={`/presentations/${presentation.id}`} className="flex items-start gap-3">
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
                  onClick={() => handleCopy(presentation)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-line bg-surface px-3 py-2.5 text-[13px] font-bold text-ink-2"
                >
                  <Icon
                    name={copiedId === presentation.id ? 'check' : 'doc'}
                    className="size-4"
                    strokeWidth={2.2}
                  />
                  {copiedId === presentation.id ? 'Nusxa olindi' : 'Nusxa olish'}
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
          ))}
        </div>
      )}
    </main>
  );
}
