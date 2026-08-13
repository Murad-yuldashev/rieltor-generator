import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Icon } from '@/shared/ui/icon';
import { PageHeading } from '@/shared/ui/page-heading';
import { SectionCard } from '@/shared/ui/section-card';

/** Section numbers 1–10 line up with offer.section{n}Title / offer.section{n}Items in
 *  the misc i18n bundle (bundles/misc.ts). Each section's items are stored as one
 *  newline-joined string rather than one key per list item, since this long
 *  legal-ish text only needs "a few big multi-line strings" — split back into an
 *  array here for rendering. */
const OFFER_SECTION_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export function OfferPage() {
  const { t } = useTranslation('misc');

  return (
    <main>
      {/* This page is not in the bottom nav, so no tab lights up — without a back
          link the user would have no cue about where they are. */}
      <Link
        to="/contact"
        className="mt-3.5 ml-4 inline-flex items-center gap-1 text-[13.5px] font-bold text-accent"
      >
        <Icon name="chevronLeft" className="h-4 w-4" strokeWidth={2.4} />
        {t('common:nav.contact')}
      </Link>

      <PageHeading title={t('offer.title')} subtitle={t('offer.updatedAt')} />

      <div className="flex flex-col gap-3.5 p-4">
        <SectionCard>
          <p className="text-[14.5px] leading-relaxed text-ink-2">{t('offer.intro')}</p>
        </SectionCard>

        {OFFER_SECTION_NUMBERS.map((n) => (
          <SectionCard key={n} title={t(`offer.section${n}Title`)}>
            <ol className="flex flex-col gap-2.5">
              {t(`offer.section${n}Items`)
                .split('\n')
                .map((item, itemIndex) => (
                  <li
                    key={`${n}-${itemIndex}`}
                    className="flex gap-2.5 text-[13.5px] leading-relaxed text-ink-2"
                  >
                    {/* Band raqami matndan ajralib tursin va uzun matn ostiga tushmasin. */}
                    <span className="shrink-0 font-bold text-ink-3 tabular-nums">
                      {n}.{itemIndex + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
            </ol>
          </SectionCard>
        ))}
      </div>
    </main>
  );
}
