import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { formatListedAt } from '@rieltor/shared';
import { ListingCard } from '@/entities/listing';
import { useDeletePresentation, usePresentation } from '@/features/presentations';
import { Icon } from '@/shared/ui/icon';
import { PresentationAnalytics } from './presentation-analytics';
import { PresentationShare } from './presentation-share';

/**
 * One presentation's analytics view: the public link (copy + Telegram share),
 * the total open count, and a per-listing breakdown (opens + average dwell,
 * ordered by position) with the client-facing note. A delete affordance drops
 * the presentation and returns to the list.
 */
export function PresentationDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();

  const { data: presentation, isPending, isError } = usePresentation(id);
  const remove = useDeletePresentation();

  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!presentation) return;
    try {
      await navigator.clipboard.writeText(presentation.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (insecure context / denied) — the link stays visible to copy manually.
    }
  }

  function handleDelete() {
    if (remove.isPending) return;
    if (!window.confirm("Bu taqdimot o'chirilsinmi?")) return;
    remove.mutate(id, { onSuccess: () => navigate('/presentations') });
  }

  // The most-viewed listing (only meaningful once something has been opened) —
  // highlighted so the realtor sees at a glance which property drew attention.
  const mostViewedId =
    presentation && presentation.items.length > 0
      ? presentation.items.reduce((best, item) => (item.opens > best.opens ? item : best))
      : undefined;
  const highlightId = mostViewedId && mostViewedId.opens > 0 ? mostViewedId.listingId : undefined;

  return (
    <main>
      <Link
        to="/presentations"
        className="mb-4 inline-flex items-center gap-1 text-[13px] font-semibold text-ink-2"
      >
        <Icon name="chevronLeft" className="size-4" />
        Mening taqdimotlarim
      </Link>

      {isPending ? (
        <p className="text-[15px] font-semibold text-ink-2">Yuklanmoqda...</p>
      ) : isError || !presentation ? (
        <p className="rounded-card bg-card p-4 text-[14px] font-semibold text-brand-rose shadow-card">
          Taqdimotni yuklab bo'lmadi. Sahifani yangilang.
        </p>
      ) : (
        <>
          <header className="mb-5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-ink-2">Taqdimot</p>
              <h1 className="text-[22px] font-extrabold tracking-tight text-ink">
                {presentation.title}
              </h1>
              {presentation.clientLabel && (
                <p className="mt-0.5 text-[14px] font-medium text-ink-2">
                  {presentation.clientLabel}
                </p>
              )}
              <p className="mt-0.5 text-[13px] font-medium text-ink-3">
                {formatListedAt(presentation.createdAt.slice(0, 10))}
              </p>
            </div>
            <button
              type="button"
              onClick={handleDelete}
              disabled={remove.isPending}
              aria-label="Taqdimotni o'chirish"
              className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card text-brand-rose shadow-card disabled:opacity-50"
            >
              <Icon name="close" className="size-4" strokeWidth={2.4} />
            </button>
          </header>

          <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[1fr_22rem] lg:items-start lg:gap-6 desk:grid-cols-[1fr_24rem]">
            {/* MAIN column — the "E'lonlar bo'yicha" heading + the per-listing grid (or
                empty state). The `contents` wrapper dissolves on phone so both children
                join the single stack; each is tagged `order-3` individually so the bare
                heading does not keep its default order:0 and jump above the aside cards. */}
            <div className="contents lg:flex lg:flex-col lg:gap-5">
              <h2 className="order-3 mb-3 text-[13px] font-bold uppercase tracking-wide text-ink-3 lg:order-none">
                E'lonlar bo'yicha
              </h2>

              {presentation.items.length === 0 ? (
                <div className="order-3 rounded-card bg-card p-8 text-center shadow-card lg:order-none">
                  <p className="text-[15px] font-bold text-ink">Bu taqdimotda e'lon yo'q</p>
                </div>
              ) : (
                <div className="order-3 flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-4 desk:grid-cols-3 lg:order-none">
                  {presentation.items.map((item, i) => (
                    <ListingCard
                      key={item.listingId}
                      listing={item.listing}
                      isFirst={i === 0}
                      noteSnippet={item.note ?? undefined}
                      footer={
                        <div className="flex flex-wrap items-center gap-2 rounded-[12px] bg-surface px-3 py-2.5">
                          <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-2">
                            <Icon name="eye" className="size-4 text-ink-3" strokeWidth={2.2} />
                            {item.opens} ochilish · o'rtacha {Math.round(item.avgDurationMs / 1000)}
                            s
                          </span>
                          {highlightId === item.listingId && (
                            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-bold text-accent-dark">
                              Eng ko'p ko'rilgan
                            </span>
                          )}
                        </div>
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            {/* STICKY ASIDE — analytics written first in the DOM so the desktop rail
                shows it on top; `order-*` keeps the phone order (share right under the
                header, analytics below), matching the pre-desktop share→analytics stack. */}
            <aside className="contents lg:sticky lg:top-24 lg:flex lg:flex-col lg:gap-5">
              <PresentationAnalytics
                presentation={presentation}
                className="order-2 lg:order-none"
              />
              <PresentationShare
                url={presentation.url}
                title={presentation.title}
                copied={copied}
                onCopy={handleCopy}
                className="order-1 lg:order-none"
              />
            </aside>
          </div>
        </>
      )}
    </main>
  );
}
