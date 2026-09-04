import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import type {
  BudgetTier,
  ConversionSegment,
  LeadOutcomeStage,
  PlatformConversion,
} from '@rieltor/shared';
import { LISTING_TYPE_META } from '@/entities/listing';
import { useSession } from '@/entities/session';
import { moderationConversionQuery } from '../api';

/** Funnel stage labels — same wording as the realtor cabinet. */
const STAGE_LABEL: Record<LeadOutcomeStage, string> = {
  NEW: 'Yangi',
  CONTACTED: "Bog'lanildi",
  MEETING: "Ko'rik",
  WON: 'Bitim',
  LOST: "Yo'qotildi",
};

/** The funnel stages in their natural order. */
const STAGE_ORDER: LeadOutcomeStage[] = ['NEW', 'CONTACTED', 'MEETING', 'WON', 'LOST'];

/** Budget-tier labels for the segment breakdown. */
const BUDGET_TIER_LABEL: Record<BudgetTier, string> = {
  NONE: 'Byudjetsiz',
  LOW: 'Past',
  MID: "O'rta",
  HIGH: 'Yuqori',
};

/** Deal labels for the segment breakdown. */
const DEAL_LABEL: Record<ConversionSegment['deal'], string> = {
  SALE: 'Sotib olish',
  RENT: 'Ijara',
};

/** Win rate as a whole-percent string, or an em dash when there are no resolved leads. */
function formatWinRate(winRate: number | null): string {
  return winRate == null ? '—' : `${Math.round(winRate * 100)}%`;
}

/** A listing type label, or an em dash when the segment has no type. */
function typeLabel(type: ConversionSegment['type']): string {
  return type == null ? '—' : LISTING_TYPE_META[type].label;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-dvh max-w-content bg-surface px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-extrabold text-ink">Konversiya</h1>
        <div className="flex items-center gap-3">
          <Link
            to="/moderation/realtors"
            className="text-[13px] font-bold text-accent hover:underline"
          >
            Rieltorlar →
          </Link>
          <Link
            to="/moderation/developers"
            className="text-[13px] font-bold text-accent hover:underline"
          >
            Quruvchilar →
          </Link>
          <Link
            to="/moderation/reviews"
            className="text-[13px] font-bold text-accent hover:underline"
          >
            Sharhlar →
          </Link>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </main>
  );
}

/** The platform funnel + segment breakdown — only mounted once the role gate has passed. */
function ConversionOverview() {
  const { data, isPending, error } = useQuery(moderationConversionQuery);

  if (isPending) {
    return <p className="py-10 text-center text-[14px] font-medium text-ink-2">Yuklanmoqda...</p>;
  }

  if (error) {
    return (
      <p className="py-10 text-center text-[14px] font-medium text-ink-2">
        Ma&apos;lumotni yuklab bo&apos;lmadi.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <PlatformFunnel funnel={data.funnel} winRate={data.winRate} />
      <SegmentTable segments={data.segments} />
    </div>
  );
}

function PlatformFunnel({
  funnel,
  winRate,
}: {
  funnel: PlatformConversion['funnel'];
  winRate: PlatformConversion['winRate'];
}) {
  return (
    <section className="rounded-card border border-line/60 bg-card p-3.5 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[15px] font-extrabold text-ink">Platforma varonkasi</h2>
        <span className="text-[13px] font-semibold text-ink-2">
          Umumiy konversiya:{' '}
          <span className="font-extrabold text-ink">{formatWinRate(winRate)}</span>
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {STAGE_ORDER.map((stage) => (
          <div
            key={stage}
            className="rounded-[10px] border border-line/60 bg-surface px-3 py-2.5 text-center"
          >
            <dt className="text-[12px] font-bold text-ink-3">{STAGE_LABEL[stage]}</dt>
            <dd className="mt-0.5 text-[18px] font-extrabold text-ink">{funnel[stage]}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function SegmentTable({ segments }: { segments: ConversionSegment[] }) {
  if (segments.length === 0) {
    return (
      <p className="rounded-card border border-line/60 bg-card px-4 py-10 text-center text-[14px] font-medium text-ink-2">
        Segmentlar yo&apos;q
      </p>
    );
  }

  return (
    <section className="rounded-card border border-line/60 bg-card p-3.5 shadow-card">
      <h2 className="text-[15px] font-extrabold text-ink">Segmentlar</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-[13px]">
          <thead>
            <tr className="text-left text-[12px] font-bold text-ink-3">
              <th className="px-2 py-2">Bitim</th>
              <th className="px-2 py-2">Tur</th>
              <th className="px-2 py-2">Byudjet</th>
              <th className="px-2 py-2 text-right">Bitim</th>
              <th className="px-2 py-2 text-right">Yo&apos;qotildi</th>
              <th className="px-2 py-2 text-right">Konversiya</th>
            </tr>
          </thead>
          <tbody>
            {segments.map((segment, index) => (
              <tr
                key={`${segment.deal}-${segment.type ?? 'none'}-${segment.budgetTier}-${index}`}
                className="border-t border-line/60"
              >
                <td className="px-2 py-2 font-semibold text-ink">{DEAL_LABEL[segment.deal]}</td>
                <td className="px-2 py-2 font-medium text-ink-2">{typeLabel(segment.type)}</td>
                <td className="px-2 py-2 font-medium text-ink-2">
                  {BUDGET_TIER_LABEL[segment.budgetTier]}
                </td>
                <td className="px-2 py-2 text-right font-semibold text-ink">{segment.won}</td>
                <td className="px-2 py-2 text-right font-semibold text-ink">{segment.lost}</td>
                <td className="px-2 py-2 text-right font-extrabold text-ink">
                  {formatWinRate(segment.winRate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/**
 * Moderator-only platform conversion overview. Rendered outside the tab layout
 * (a full-screen admin surface, same as the review/realtor screens). Read-only:
 * the route is not hidden — the gate here is the real client-side protection,
 * backed by the API's bearer-token check.
 */
export function ModerationConversionPage() {
  const { user, isPending } = useSession();

  if (isPending) {
    return (
      <Shell>
        <p className="py-10 text-center text-[14px] font-medium text-ink-2">Yuklanmoqda...</p>
      </Shell>
    );
  }

  const isModerator = user?.role === 'MODERATOR' || user?.role === 'ADMIN';
  if (!isModerator) {
    return (
      <Shell>
        <div className="rounded-card border border-line/60 bg-card px-4 py-10 text-center">
          <p className="text-[15px] font-extrabold text-ink">Ruxsat yo&apos;q</p>
          <p className="mt-1 text-[13.5px] font-medium text-ink-2">
            Bu sahifa faqat moderatorlar uchun.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <ConversionOverview />
    </Shell>
  );
}
