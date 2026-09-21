import { useState } from 'react';
import { Link } from 'react-router';
import { type PresentationSummary } from '@rieltor/shared';
import { usePresentations } from '@/features/presentations';
import { Icon } from '@/shared/ui/icon';
import { PresentationsStats } from './presentations-stats';
import { PresentationCard } from './presentation-card';

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
    <main>
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
        <div className="flex flex-col gap-5">
          <PresentationsStats list={presentations} />
          <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4 lg:grid-cols-3 desk:grid-cols-4 desk:gap-5">
            {presentations.map((presentation) => (
              <PresentationCard
                key={presentation.id}
                presentation={presentation}
                copied={copiedId === presentation.id}
                onCopy={() => handleCopy(presentation)}
              />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
