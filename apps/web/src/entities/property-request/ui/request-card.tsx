import type { ReactNode } from 'react';
import { formatPriceSom, type Lead, type PropertyRequestSummary } from '@rieltor/shared';

const DEAL_LABEL = { SALE: 'Sotib olish', RENT: 'Ijara' } as const;

/**
 * Local copy of the listing-type labels. `entities/property-request` may not
 * import `entities/listing` (FSD forbids an entity → entity dependency), and
 * `LISTING_TYPE_META` also carries Tailwind badge classes this card never needs
 * — so only the four label strings are mirrored here.
 */
const TYPE_LABEL = {
  NEW_BUILD: 'Yangi qurilish',
  SECONDARY: 'Ikkilamchi',
  HOUSE: 'Hovli',
  COMMERCIAL: 'Tijorat',
} as const;

/** `createdAt` is a full ISO timestamp — a compact "N oldin" line reads fresher than a date. */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const mins = Math.floor((Date.now() - then) / 60_000);
  if (mins < 1) return 'Hozirgina';
  if (mins < 60) return `${mins} daqiqa oldin`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} soat oldin`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} kun oldin`;
  if (days < 30) return `${Math.floor(days / 7)} hafta oldin`;
  if (days < 365) return `${Math.floor(days / 30)} oy oldin`;
  return `${Math.floor(days / 365)} yil oldin`;
}

interface Props {
  /**
   * A buyer's request summary. `score`/`priceSom` are realtor-only (they exist on
   * `Lead`, not the base summary), so they are optional here: the realtor feed
   * passes a `Lead` (with them) and opts into `showLeadMeta`; the buyer's own
   * "my requests" passes a plain summary (without them).
   */
  request: PropertyRequestSummary & Partial<Pick<Lead, 'score' | 'priceSom'>>;
  /** The board swaps in a reveal button; omitted, the masked phone is shown. */
  revealSlot?: ReactNode;
  /** Owner controls (status chip, close/delete) shown in a bottom footer on "my requests". */
  actionSlot?: ReactNode;
  /**
   * Realtor-only lead metadata: the quality score badge + the claim-fee price.
   * Off by default so the buyer's own "my requests" cards never expose the score
   * or the price a realtor pays to claim the request — only the realtor lead feed
   * opts in.
   */
  showLeadMeta?: boolean;
}

/** Presentational card for one "Qidiryapman" buyer request. */
export function RequestCard({ request, revealSlot, actionSlot, showLeadMeta = false }: Props) {
  const titleParts = [
    DEAL_LABEL[request.deal],
    request.type ? TYPE_LABEL[request.type] : null,
    request.district,
  ].filter(Boolean);

  const constraints: string[] = [];
  if (request.roomsMin != null) constraints.push(`${request.roomsMin}+ xona`);
  if (request.priceMaxSom)
    constraints.push(`${formatPriceSom(request.priceMaxSom, request.deal)} gacha`);
  if (request.areaMinM2 != null) constraints.push(`${request.areaMinM2} m²+`);

  return (
    <article className="flex flex-col gap-3 rounded-card border border-line/60 bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-extrabold tracking-tight text-ink">
            {titleParts.join(' · ')}
          </p>
          <p className="mt-0.5 text-[12.5px] font-semibold text-ink-3">
            {relativeTime(request.createdAt)}
          </p>
        </div>
        {showLeadMeta && request.score != null && (
          <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-[12px] font-extrabold text-accent">
            Sifat: {request.score}
          </span>
        )}
      </div>

      {showLeadMeta && request.priceSom && (
        <p className="text-[15px] font-extrabold text-ink">
          {/* The claim fee is a one-time charge, never monthly — force SALE so a
              RENT lead's fee is not suffixed "/oy". The buyer's budget below keeps
              its deal-aware formatting. */}
          {formatPriceSom(request.priceSom, 'SALE')}
        </p>
      )}

      {constraints.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {constraints.map((c) => (
            <span
              key={c}
              className="rounded-full bg-surface px-2.5 py-1 text-[12.5px] font-bold text-ink-2"
            >
              {c}
            </span>
          ))}
        </div>
      )}

      {request.note && <p className="text-[13.5px] leading-relaxed text-ink-2">{request.note}</p>}

      <div className="flex items-center gap-2">
        {revealSlot ?? (
          <span className="text-[14px] font-bold text-ink-2">{request.authorPhoneMasked}</span>
        )}
      </div>

      {actionSlot && <div className="border-t border-line pt-3">{actionSlot}</div>}
    </article>
  );
}
