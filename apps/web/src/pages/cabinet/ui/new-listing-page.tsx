import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useMe } from '@/features/auth';
import { createDraft } from '@/features/listing-form';

/**
 * No form of its own: POST /api/objects creates an empty DRAFT and this immediately
 * hands off to its edit page. Image upload needs a listing id to exist first (the
 * endpoint is POST /api/objects/:id/images), so there is no useful "new" state for
 * ListingForm to render — every real field lives on /cabinet/obj/:id/edit.
 */
export function NewListingPage() {
  const { t } = useTranslation('cabinet');
  const { realtor, isLoading } = useMe();
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  function start() {
    started.current = true;
    setFailed(false);
    createDraft({})
      .then(({ id }) => navigate(`/cabinet/obj/${id}/edit`, { replace: true }))
      .catch(() => setFailed(true));
  }

  useEffect(() => {
    if (realtor && !started.current) start();
    // `start` is deliberately left out of the deps: this effect is a one-shot
    // bootstrap keyed on `realtor` becoming available, not a dependency on `start`
    // itself; the retry button below calls `start` directly on click.
  }, [realtor]);

  if (isLoading) {
    return (
      <main className="px-4 py-6">
        <p className="text-[14px] font-semibold text-ink-3">{t('common:loading')}</p>
      </main>
    );
  }

  // Publicly reachable route: bounce a signed-out visitor to /cabinet, which owns
  // the sign-in prompt (same convention as ProfilePage).
  if (!realtor) return <Navigate to="/cabinet" replace />;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      {failed ? (
        <>
          <p className="text-[14px] font-semibold text-ink-2">{t('createDraftFailed')}</p>
          <button
            type="button"
            onClick={start}
            className="rounded-[14px] bg-accent px-5 py-3 text-[14.5px] font-extrabold text-white"
          >
            {t('retryAction')}
          </button>
        </>
      ) : (
        <p className="text-[14px] font-semibold text-ink-3">{t('creatingDraft')}</p>
      )}
    </main>
  );
}
