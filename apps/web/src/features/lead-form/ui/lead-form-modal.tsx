import type { TFunction } from 'i18next';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/shared/api/client';
import { Icon } from '@/shared/ui/icon';
import { useLeadForm } from '../model/use-lead-form';

interface Props {
  open: boolean;
  onClose: () => void;
  listingId: string;
}

const INPUT_CLASS =
  'w-full rounded-[12px] border border-line bg-surface px-3 py-2.5 text-[15px] font-semibold';

function submitErrorMessage(error: unknown, t: TFunction<'listing'>): string {
  if (error instanceof ApiError) {
    // Matches the API's own messages (leads.service.ts) — same wording the realtor
    // would see, just addressed to the visitor instead.
    if (error.status === 409) return t('leadForm.error.duplicate');
    if (error.status === 404) return t('leadForm.error.notFound');
  }
  return t('leadForm.error.generic');
}

/**
 * The "Raqamimni qoldiraman" screen (design spec §8.4) — reuses the SharePanel/
 * LocationPicker bottom-sheet-in-a-portal pattern (features/listing-share,
 * features/user-location) for a consistent feel across the app's modals.
 */
export function LeadFormModal({ open, onClose, listingId }: Props) {
  const { t } = useTranslation('listing');
  const { form, setField, errors, submit, reset, submission } = useLeadForm(listingId);

  useEffect(() => {
    if (!open) return;
    reset();
    // Fires once per open — `reset` (a fresh function identity every render) is
    // deliberately left out of the deps: this must run once per `open` flip, not
    // once per render. Same reasoning as SharePanel's identically-shaped effect.
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-label={t('leadForm.title')}
      className="fixed inset-0 z-[60] flex flex-col justify-end bg-ink/40"
    >
      <div className="flex max-h-[85vh] flex-col rounded-t-[20px] bg-card p-4">
        <div className="mb-3 flex shrink-0 items-center justify-between">
          <h2 className="text-[16px] font-extrabold">{t('leadForm.title')}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common:close')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink-2"
          >
            <Icon name="close" className="h-[18px] w-[18px]" strokeWidth={2.6} />
          </button>
        </div>

        {submission.isSuccess ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
              <Icon name="check" className="h-7 w-7" strokeWidth={3} />
            </span>
            <p className="text-[15px] font-bold text-ink">{t('leadForm.successMessage')}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-1 rounded-[14px] bg-accent px-6 py-3 text-[14.5px] font-extrabold text-white"
            >
              {t('common:close')}
            </button>
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
            className="min-h-0 overflow-y-auto"
          >
            <p className="mb-3 text-[13.5px] text-ink-2">{t('leadForm.description')}</p>

            <label className="block py-2">
              <span className="mb-1 block text-xs font-bold text-ink-3">
                {t('leadForm.nameLabel')}
              </span>
              <input
                value={form.name}
                onChange={(event) => setField('name', event.target.value)}
                maxLength={60}
                placeholder={t('leadForm.namePlaceholder')}
                className={INPUT_CLASS}
              />
              {errors.name && (
                <span className="mt-1 block text-[13px] font-bold text-red-600">{errors.name}</span>
              )}
            </label>

            <label className="block py-2">
              <span className="mb-1 block text-xs font-bold text-ink-3">
                {t('leadForm.phoneLabel')}
              </span>
              <input
                value={form.phone}
                onChange={(event) => setField('phone', event.target.value)}
                inputMode="tel"
                placeholder={t('leadForm.phonePlaceholder')}
                className={INPUT_CLASS}
              />
              {errors.phone && (
                <span className="mt-1 block text-[13px] font-bold text-red-600">{errors.phone}</span>
              )}
            </label>

            {/* Honeypot (design spec §8.4) — invisible and unreachable to a real
                visitor: zero-sized, out of the tab order, hidden from assistive tech.
                A bot that blindly fills every input still populates it, which the API
                (LEAD_HONEYPOT_FIELD) rejects. Never type="hidden" — some simple bots
                skip those, defeating the trap. */}
            <input
              type="text"
              name="website"
              value={form.website}
              onChange={(event) => setField('website', event.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute h-0 w-0 overflow-hidden opacity-0"
            />

            {submission.isError && (
              <p className="mt-1 text-[13px] font-bold text-red-600">
                {submitErrorMessage(submission.error, t)}
              </p>
            )}

            <button
              type="submit"
              disabled={submission.isPending}
              className="mt-3.5 w-full rounded-[14px] bg-accent py-3.5 text-[15px] font-extrabold text-white disabled:opacity-60"
            >
              {submission.isPending ? t('leadForm.submitting') : t('leadForm.submit')}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
