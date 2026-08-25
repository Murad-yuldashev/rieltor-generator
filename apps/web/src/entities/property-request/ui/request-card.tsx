import type { ReactNode } from 'react';
import { formatPriceSom, type PropertyRequestSummary } from '@rieltor/shared';

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
  request: PropertyRequestSummary;
  /** The board swaps in a reveal button; omitted, the masked phone is shown. */
  revealSlot?: ReactNode;
  /** Owner controls (status chip, close/delete) shown in a bottom footer on "my requests". */
  actionSlot?: ReactNode;
}

/** Presentational card for one "Qidiryapman" buyer request. */
export function RequestCard({ request, revealSlot, actionSlot }: Props) {
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
      </div>

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
