import { formatPriceSom, type CollectionItem } from '@rieltor/shared';
import { cn } from '@/shared/lib/cn';

/**
 * Derive the price range (min/max) and average across a collection's items.
 * `priceSom` is a BigInt-as-string — reduced with BigInt so the arithmetic never
 * loses precision (never `Number()`). Returns null for an empty collection.
 */
function priceRange(items: CollectionItem[]) {
  if (items.length === 0) return null;
  const prices = items.map((it) => BigInt(it.listing.priceSom)); // BigInt-safe, never Number()
  let min = prices[0] ?? 0n,
    max = prices[0] ?? 0n,
    sum = 0n;
  for (const p of prices) {
    if (p < min) min = p;
    if (p > max) max = p;
    sum += p;
  }
  const avg = sum / BigInt(items.length);
  return {
    min: formatPriceSom(min.toString(), 'SALE'), // mixed SALE/RENT -> no '/oy'
    max: formatPriceSom(max.toString(), 'SALE'),
    avg: formatPriceSom(avg.toString(), 'SALE'),
  };
}

/**
 * Read-only overview card for the detail page's sticky rail — the collection name,
 * its item count and (when items exist) a BigInt-derived price range and average.
 * Purely presentational: everything derives from the loaded items.
 */
export function CollectionSummaryCard({
  name,
  items,
  className,
}: {
  name: string;
  items: CollectionItem[];
  className?: string;
}) {
  const range = priceRange(items);
  return (
    <section className={cn('rounded-card bg-card p-5 shadow-card', className)}>
      <h2 className="text-[17px] font-extrabold tracking-tight text-ink">{name}</h2>
      <p className="mt-1.5 text-[13px] font-medium text-ink-2">{items.length} ta e'lon</p>
      {range && (
        <dl className="mt-4 flex flex-col gap-2 border-t border-line pt-4 text-[13px]">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-ink-3">Narx oralig'i</dt>
            <dd className="font-semibold text-ink-2">
              {range.min} – {range.max}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-ink-3">O'rtacha</dt>
            <dd className="font-semibold text-ink-2">{range.avg}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}
