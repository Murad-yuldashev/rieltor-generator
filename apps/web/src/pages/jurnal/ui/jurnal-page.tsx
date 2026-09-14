import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { type ArticleCategory } from '@rieltor/shared';
import { ArticleCard, CATEGORY_LABEL, articlesQuery } from '@/entities/journal';
import { PageHeading } from '@/shared/ui/page-heading';

/** The category chips, in a fixed order — plus the "all" option rendered first. */
const CATEGORIES = Object.keys(CATEGORY_LABEL) as ArticleCategory[];

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-line/60 bg-card shadow-card">
      <div className="aspect-[16/9] w-full animate-pulse bg-line" />
      <div className="space-y-2.5 p-4">
        <div className="h-5 w-3/4 animate-pulse rounded bg-line" />
        <div className="h-4 w-full animate-pulse rounded bg-line" />
        <div className="h-4 w-2/5 animate-pulse rounded bg-line" />
      </div>
    </div>
  );
}

export function JurnalPage() {
  // `null` means "Hammasi" (all) — the query then omits the category filter.
  const [category, setCategory] = useState<ArticleCategory | null>(null);
  const { data, isPending, isError } = useQuery(articlesQuery(category ?? undefined));

  return (
    <main>
      <PageHeading title="Jurnal" subtitle="Ko'chmas mulk bozori, qo'llanmalar va yangiliklar" />

      <div className="flex gap-2 overflow-x-auto px-4 pt-3.5 pb-1 desk:px-0">
        <button
          type="button"
          aria-pressed={category === null}
          onClick={() => setCategory(null)}
          className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-bold transition-colors ${
            category === null ? 'bg-accent text-white' : 'bg-surface text-ink-2'
          }`}
        >
          Hammasi
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
            className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-bold transition-colors ${
              category === c ? 'bg-accent text-white' : 'bg-surface text-ink-2'
            }`}
          >
            {CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 px-4 pt-3.5 md:grid md:grid-cols-2 md:gap-4 lg:grid-cols-3 desk:gap-5 desk:px-0 desk:pt-5">
        {isPending && Array.from({ length: 4 }, (_, i) => <CardSkeleton key={i} />)}

        {data?.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>

      {isError && (
        <p className="px-6 py-12 text-center text-[15px] text-ink-2">
          Maqolalarni yuklab bo'lmadi. Keyinroq urinib ko'ring.
        </p>
      )}

      {!isPending && !isError && (data?.length ?? 0) === 0 && (
        <p className="px-6 py-12 text-center text-[15px] leading-relaxed text-ink-2">
          Hozircha maqolalar yo'q. Keyinroq qayta kiring.
        </p>
      )}
    </main>
  );
}
