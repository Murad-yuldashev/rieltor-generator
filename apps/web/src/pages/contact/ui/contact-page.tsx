import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { AGENCY } from '@/shared/config/agency';
import { Icon } from '@/shared/ui/icon';
import { PageHeading } from '@/shared/ui/page-heading';
import { SectionCard } from '@/shared/ui/section-card';

function FaqItem({ question, answer }: { question: string; answer: string }) {
  // Collapsed by default so the question list fits one screen; the user opens what they need.
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-line first:border-t-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 py-3.5 text-left"
      >
        <span className="flex-1 text-[14.5px] leading-snug font-bold">{question}</span>
        <Icon
          name={open ? 'chevronUp' : 'chevronDown'}
          className="h-4 w-4 shrink-0 text-ink-3"
          strokeWidth={2.4}
        />
      </button>
      {open && <p className="pb-4 text-[13.5px] leading-relaxed text-ink-2">{answer}</p>}
    </div>
  );
}

/** Question/answer pairs live in the misc i18n bundle as faq.q1/faq.a1 etc.
 *  (bundles/misc.ts) — one pair per FAQ entry, in display order. */
const FAQ_KEYS = ['1', '2', '3'] as const;

export function ContactPage() {
  const { t } = useTranslation('misc');

  return (
    <main>
      <PageHeading title={t('common:nav.contact')} subtitle={t('contactSubtitle')} />

      <div className="flex flex-col gap-3.5 p-4">
        <SectionCard className="py-6 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-violet-600 to-accent-dark text-white">
            <Icon name="homeSolid" className="h-8 w-8" strokeWidth={2} />
          </span>
          <h2 className="mt-3.5 text-[19px] font-extrabold tracking-tight">{t('agencyName')}</h2>
          <p className="mx-auto mt-1.5 max-w-[19rem] text-[13.5px] leading-relaxed text-ink-2">
            {t('agencyAbout')}
          </p>
        </SectionCard>

        <div className="flex gap-2.5">
          <a
            href={`tel:${AGENCY.phone}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark py-3.5 text-[15px] font-extrabold text-white shadow-lg shadow-accent/35"
          >
            <Icon name="phone" className="h-[17px] w-[17px]" strokeWidth={2.2} />
            {t('call')}
          </a>
          <a
            href={`https://t.me/${AGENCY.telegram}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-telegram bg-card py-3.5 text-[15px] font-extrabold text-telegram"
          >
            <Icon name="telegram" className="h-[17px] w-[17px]" />
            {t('telegram')}
          </a>
        </div>

        <SectionCard className="py-1">
          <Link to="/offer" className="flex items-center gap-3 py-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-white">
              <Icon name="doc" className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14.5px] font-bold">{t('offer.title')}</span>
              <span className="block text-xs font-semibold text-ink-3">
                {t('offerLinkSubtitle')}
              </span>
            </span>
            <Icon name="chevronRight" className="h-4 w-4 text-ink-3" strokeWidth={2.4} />
          </Link>
        </SectionCard>

        <SectionCard className="py-1">
          <Link to="/cabinet" className="flex items-center gap-3 py-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-white">
              <Icon name="homeSolid" className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14.5px] font-bold">{t('forRealtors')}</span>
              <span className="block text-xs font-semibold text-ink-3">
                {t('forRealtorsSubtitle')}
              </span>
            </span>
            <Icon name="chevronRight" className="h-4 w-4 text-ink-3" strokeWidth={2.4} />
          </Link>
        </SectionCard>

        <SectionCard title={t('faq.title')}>
          {FAQ_KEYS.map((key) => (
            <FaqItem key={key} question={t(`faq.q${key}`)} answer={t(`faq.a${key}`)} />
          ))}
        </SectionCard>
      </div>
    </main>
  );
}
