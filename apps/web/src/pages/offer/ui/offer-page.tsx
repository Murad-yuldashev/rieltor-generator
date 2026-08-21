import { Link } from 'react-router';
import { OFFER_INTRO, OFFER_SECTIONS, OFFER_UPDATED_AT } from '@/shared/config/offer';
import { Icon } from '@/shared/ui/icon';
import { PageHeading } from '@/shared/ui/page-heading';
import { SectionCard } from '@/shared/ui/section-card';

export function OfferPage() {
  return (
    <main>
      {/* This page is not in the bottom nav, so no tab lights up — without a back
          link the user would have no cue about where they are. */}
      <Link
        to="/contact"
        className="mt-3.5 ml-4 inline-flex items-center gap-1 text-[13.5px] font-bold text-accent desk:mt-0 desk:ml-0"
      >
        <Icon name="chevronLeft" className="h-4 w-4" strokeWidth={2.4} />
        Aloqa
      </Link>

      <PageHeading title="Ommaviy oferta" subtitle={`Oxirgi tahrir: ${OFFER_UPDATED_AT}`} />

      <div className="flex flex-col gap-3.5 p-4 desk:max-w-3xl desk:px-0">
        <SectionCard>
          <p className="text-[14.5px] leading-relaxed text-ink-2">{OFFER_INTRO}</p>
        </SectionCard>

        {OFFER_SECTIONS.map((section, sectionIndex) => (
          <SectionCard key={section.title} title={section.title}>
            <ol className="flex flex-col gap-2.5">
              {section.items.map((item, itemIndex) => (
                <li key={item} className="flex gap-2.5 text-[13.5px] leading-relaxed text-ink-2">
                  {/* Band raqami matndan ajralib tursin va uzun matn ostiga tushmasin. */}
                  <span className="shrink-0 font-bold text-ink-3 tabular-nums">
                    {sectionIndex + 1}.{itemIndex + 1}
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
