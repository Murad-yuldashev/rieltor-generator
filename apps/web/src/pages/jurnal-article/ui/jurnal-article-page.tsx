import { Suspense, lazy } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { formatListedAt, imageFallbackSrc, imageSrcSet } from '@rieltor/shared';
import { CATEGORY_LABEL, articleQuery } from '@/entities/journal';
import { ApiError } from '@/shared/api/client';
import { Icon } from '@/shared/ui/icon';
import { NotFoundView } from '@/widgets/not-found';
import { SiteHeader } from '@/widgets/site-header';

// Lazy via the MODULE path (not the barrel): react-markdown + its micromark tree land in
// their own async chunk, kept out of the entry bundle (R6).
const Markdown = lazy(() => import('@/shared/ui/markdown/markdown'));

function PageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="aspect-[16/9] w-full animate-pulse rounded-card bg-line" />
      <div className="h-8 w-3/4 animate-pulse rounded bg-line" />
      <div className="h-4 w-2/5 animate-pulse rounded bg-line" />
      <div className="space-y-2 pt-2">
        <div className="h-4 w-full animate-pulse rounded bg-line" />
        <div className="h-4 w-full animate-pulse rounded bg-line" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-line" />
      </div>
    </div>
  );
}

export function JurnalArticlePage() {
  const { slug = '' } = useParams();
  const { data, isPending, error } = useQuery(articleQuery(slug));

  return (
    <div className="min-h-dvh bg-surface">
      <SiteHeader />

      <main className="mx-auto max-w-content px-4 py-5 md:max-w-[46rem] md:px-6 md:py-8">
        {isPending && <PageSkeleton />}

        {error &&
          // A 404 (slug not published) gets the graceful "not found" view, like the ЖК page.
          (error instanceof ApiError && error.status === 404 ? (
            <NotFoundView />
          ) : (
            <p className="py-12 text-center text-[15px] text-ink-2">
              Maqolani yuklab bo'lmadi. Keyinroq urinib ko'ring.
            </p>
          ))}

        {data && (
          <article>
            <Link
              to="/jurnal"
              className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-2 transition-colors hover:text-ink"
            >
              <Icon name="chevronLeft" className="h-4 w-4" strokeWidth={2.4} />
              Jurnal
            </Link>

            {data.cover && (
              <img
                srcSet={imageSrcSet(data.cover.base)}
                src={imageFallbackSrc(data.cover.base)}
                sizes="(max-width: 736px) 100vw, 736px"
                width={data.cover.width}
                height={data.cover.height}
                alt=""
                loading="eager"
                fetchPriority="high"
                className="mt-3.5 aspect-[16/9] w-full rounded-card object-cover"
              />
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2 text-[12.5px] font-semibold text-ink-3">
              <span className="rounded-lg bg-accent-soft px-2 py-1 text-[11.5px] font-bold text-accent">
                {CATEGORY_LABEL[data.category]}
              </span>
              {data.publishedAt && <span>{formatListedAt(data.publishedAt.slice(0, 10))}</span>}
              <span aria-hidden>·</span>
              <span>{data.authorName}</span>
            </div>

            <h1 className="mt-2.5 text-[26px] leading-[1.25] font-extrabold tracking-tight text-ink">
              {data.title}
            </h1>

            <div className="mt-5">
              <Suspense fallback={<PageSkeleton />}>
                <Markdown>{data.body}</Markdown>
              </Suspense>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
