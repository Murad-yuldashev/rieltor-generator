import { Link } from 'react-router';
import { formatListedAt, type CollectionSummary } from '@rieltor/shared';
import { Icon } from '@/shared/ui/icon';

/**
 * One collection in the list grid — a `<Link>`-as-card linking to its detail page.
 * Purely presentational: a heart glyph in an accent-soft circle, the truncated name,
 * the item count and the last-updated date. Layout only; per-card rename/delete/share
 * stay on the detail page.
 */
export function CollectionCard({ collection }: { collection: CollectionSummary }) {
  const updated = formatListedAt(collection.updatedAt.slice(0, 10));
  return (
    <Link
      to={`/collections/${collection.id}`}
      className="flex flex-col gap-2 rounded-card border border-line/60 bg-card p-4 shadow-card"
    >
      <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Icon name="heart" className="size-5" />
      </span>
      <span className="truncate text-[15px] font-bold text-ink">{collection.name}</span>
      <span className="text-[13px] font-medium text-ink-2">{collection.itemCount} ta e'lon</span>
      <span className="text-[12px] text-ink-3">Yangilangan: {updated}</span>
    </Link>
  );
}
