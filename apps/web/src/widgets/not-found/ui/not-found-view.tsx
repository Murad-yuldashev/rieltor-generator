import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

interface Props {
  title?: string;
  subtitle?: string;
  linkLabel?: string;
}

/** Generic centred 404 block. Defaults come from the misc i18n bundle's notFoundTitle /
 *  notFoundSubtitle / notFoundLinkLabel (bundles/misc.ts) so every existing call site
 *  (the catch-all route, a bad /obj/:id) is unaffected; a caller like the realtor
 *  showcase page passes its own copy instead. */
export function NotFoundView({ title, subtitle, linkLabel }: Props = {}) {
  const { t } = useTranslation('misc');

  return (
    <main className="mx-auto flex min-h-dvh max-w-content flex-col items-center justify-center gap-3 bg-surface p-6 text-center">
      <p className="text-5xl font-extrabold text-ink-3/50">404</p>
      <h1 className="text-lg font-bold">{title ?? t('notFoundTitle')}</h1>
      <p className="text-sm text-ink-2">{subtitle ?? t('notFoundSubtitle')}</p>
      <Link
        to="/"
        className="mt-2 rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-accent/35"
      >
        {linkLabel ?? t('notFoundLinkLabel')}
      </Link>
    </main>
  );
}
