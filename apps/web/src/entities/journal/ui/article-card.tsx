import { Link } from 'react-router';
import {
  formatListedAt,
  imageFallbackSrc,
  imageSrcSet,
  type ArticleCategory,
  type ArticleSummary,
} from '@rieltor/shared';

/** Uzbek badge/filter label per category — finite keys, so the map is exhaustive. */
export const CATEGORY_LABEL: Record<ArticleCategory, string> = {
  BOZOR: 'Bozor',
  QOLLANMA: "Qo'llanma",
  YANGILIK: 'Yangilik',
};

interface Props {
  article: ArticleSummary;
}

export function ArticleCard({ article }: Props) {
  const { slug, title, excerpt, category, cover, publishedAt } = article;

  return (
    <article className="overflow-hidden rounded-card border border-line/60 bg-card shadow-card">
      <Link to={`/jurnal/${slug}`} className="block">
        <div className="relative aspect-[16/9] bg-line">
          {/* Raw <img>, not <ResponsiveImage>: ArticleCover has no `position`, which the
              ResponsiveImage `image: Image` prop requires — this mirrors it minus that field. */}
          {cover && (
            <img
              srcSet={imageSrcSet(cover.base)}
              src={imageFallbackSrc(cover.base)}
              width={cover.width}
              height={cover.height}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          )}

          <div className="absolute top-3 left-3">
            <span className="rounded-lg bg-ink/55 px-2 py-1 text-[11.5px] font-bold text-white backdrop-blur-sm">
              {CATEGORY_LABEL[category]}
            </span>
          </div>
        </div>

        <div className="px-[15px] pt-3.5 pb-[15px]">
          <h3 className="text-[16px] leading-[1.35] font-extrabold tracking-tight">{title}</h3>

          <p className="mt-2 line-clamp-2 text-[13.5px] leading-relaxed text-ink-2">{excerpt}</p>

          {publishedAt && (
            <p className="mt-3 text-[12.5px] font-semibold text-ink-3">
              {formatListedAt(publishedAt.slice(0, 10))}
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}
