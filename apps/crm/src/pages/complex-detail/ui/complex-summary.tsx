import { imageVariantSrc, type ComplexDetail } from '@rieltor/shared';
import {
  COMPLEX_STATUS_BADGE,
  COMPLEX_STATUS_LABELS,
  PUBLISH_STATE_BADGE,
  PUBLISH_STATE_LABELS,
} from '@/features/developer';
import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';

/** Per-complex gallery cap — mirrors the media manager's MAX_COMPLEX_IMAGES. */
const MAX_COMPLEX_IMAGES = 20;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('uz-UZ');
}

/**
 * Read-only identity/overview card for the detail page's sticky rail — the at-a-glance
 * summary the edit form does not surface (cover, badges, counts, created date, map link).
 * Purely presentational: it derives everything from the loaded `ComplexDetail`, mirroring
 * the web complex-page's OSM `mapUrl` idiom for the "Xaritada ko'rish" link.
 */
export function ComplexSummaryCard({
  complex,
  className,
}: {
  complex: ComplexDetail;
  className?: string;
}) {
  // commissionBps is basis points (250 → 2.5%); null means no default rate set.
  const commissionPercent = complex.commissionBps != null ? complex.commissionBps / 100 : null;

  // Ruling B (web complex-page): no map library — when coordinates exist we link out to
  // OpenStreetMap; otherwise the map link is simply omitted.
  const mapUrl =
    complex.latitude != null && complex.longitude != null
      ? `https://www.openstreetmap.org/?mlat=${complex.latitude}&mlon=${complex.longitude}#map=16/${complex.latitude}/${complex.longitude}`
      : null;

  return (
    <section className={cn('rounded-card bg-card p-5 shadow-card', className)}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-[14px] bg-line">
        {complex.coverImage ? (
          <img
            src={imageVariantSrc(complex.coverImage.base, 720)}
            width={complex.coverImage.width}
            height={complex.coverImage.height}
            alt={complex.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-[13px] font-semibold text-ink-3">
            Rasm yo'q
          </span>
        )}

        <span
          className={cn(
            'absolute top-3 left-3 rounded-full px-2.5 py-1 text-[11.5px] font-bold shadow-sm backdrop-blur-sm',
            COMPLEX_STATUS_BADGE[complex.status],
          )}
        >
          {COMPLEX_STATUS_LABELS[complex.status]}
        </span>
      </div>

      <h2 className="mt-4 text-[17px] font-extrabold tracking-tight text-ink">{complex.name}</h2>

      <p className="mt-1.5 flex items-center gap-1.5 text-[13px] font-medium text-ink-2">
        <Icon name="pin" className="h-3.5 w-3.5 shrink-0 text-ink-3" strokeWidth={2.2} />
        <span className="truncate">{complex.district}</span>
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-[11.5px] font-bold',
            PUBLISH_STATE_BADGE[complex.publishStatus],
          )}
        >
          {PUBLISH_STATE_LABELS[complex.publishStatus]}
        </span>
        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-[11.5px] font-bold',
            complex.imageCount === 0 ? 'bg-brand-rose/10 text-brand-rose' : 'bg-surface text-ink-2',
          )}
        >
          {complex.imageCount} / {MAX_COMPLEX_IMAGES} rasm
        </span>
        <span className="rounded-full bg-surface px-2.5 py-1 text-[11.5px] font-bold text-ink-2">
          {complex.buildings.length} bino
        </span>
        {commissionPercent != null && (
          <span className="rounded-full bg-surface px-2.5 py-1 text-[11.5px] font-bold text-ink-2">
            Komissiya {commissionPercent}%
          </span>
        )}
      </div>

      <dl className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4 text-[13px]">
        <dt className="text-ink-3">Yaratilgan</dt>
        <dd className="font-semibold text-ink-2">{formatDate(complex.createdAt)}</dd>
      </dl>

      {mapUrl && (
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 rounded-[12px] border border-line bg-surface px-3.5 py-2.5 text-[13px] font-bold text-accent-dark"
        >
          <Icon name="pin" className="h-4 w-4" strokeWidth={2.2} />
          Xaritada ko'rish
        </a>
      )}
    </section>
  );
}
