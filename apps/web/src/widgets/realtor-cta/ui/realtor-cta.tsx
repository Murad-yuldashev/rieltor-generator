import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Icon } from '@/shared/ui/icon';

/**
 * The cabinet's entry point. It used to be a link in the site header, but at 360px
 * the header could not hold it alongside the location chip — so it lives here, above
 * the search block, where there is room to say what it actually offers.
 *
 * Text and button are stacked (`flex-col items-start`) rather than side by side:
 * at 360px, the button next to the copy left the paragraph only ~53px wide,
 * wrapping one word per line — measured with a headless-browser check during
 * development. Stacking keeps both legible without any horizontal scroll.
 */
export function RealtorCta() {
  const { t } = useTranslation('listing');
  return (
    <section className="px-4 pt-3">
      <div className="flex flex-col items-start gap-2.5 rounded-card border border-line/60 bg-card p-3.5 shadow-card">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <Icon name="homeSolid" className="h-5 w-5" strokeWidth={2.2} />
          </span>

          <p className="min-w-0 flex-1 text-[13px] leading-[1.35] font-semibold text-ink-2">
            {t('realtorCta.pitch')}
          </p>
        </div>

        <Link
          to="/cabinet"
          // No `whitespace-nowrap`: RU/EN can run a couple characters longer than the
          // UZ original, so the label wraps to a second line instead of clipping.
          className="w-full rounded-[12px] bg-accent px-3 py-2 text-center text-[12.5px] font-extrabold text-white"
        >
          {t('realtorCta.cta')}
        </Link>
      </div>
    </section>
  );
}
