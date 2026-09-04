import { useState } from 'react';
import type { ComplexInquiry } from '@rieltor/shared';
import { openLoginModal } from '@/entities/session';
import { ApiError } from '@/shared/api/client';
import { readTokens } from '@/shared/api/auth-storage';
import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';
import { useComplexInquiry } from '../model/use-complex-inquiry';

interface UnitOption {
  id: string;
  label: string;
}

interface Props {
  slug: string;
  /** AVAILABLE units offered for pre-selection in the form (may be empty). */
  units: UnitOption[];
  /** Lets the complex page order this block inside its desktop sidebar. */
  className?: string;
}

/** The shared shell so the fixed mobile bar and the static desktop card match. */
function CtaShell({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 mx-auto max-w-content border-t border-line bg-white/96 px-4 pt-3 pb-cta-safe backdrop-blur-xl desk:static desk:inset-x-auto desk:mx-0 desk:max-w-none desk:rounded-card desk:border desk:border-line/60 desk:bg-card desk:p-4 desk:shadow-card desk:backdrop-blur-none',
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * The buyer's call-to-action. The app has no standalone login route — signing in
 * is a shared app-wide modal (`openLoginModal`) mounted at the root — so an
 * anonymous tap opens that modal over this very ЖК page (the "return path" is
 * just staying put) and the buyer retries afterwards. A signed-in tap opens a
 * small form (optional note + optional unit pre-select) that posts the inquiry.
 */
export function InquiryButton({ slug, units, className }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [note, setNote] = useState('');
  const [unitId, setUnitId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inquiry = useComplexInquiry(slug);

  function onCtaClick() {
    // A synchronous token check keeps the gate instant — no round-trip to /auth/me
    // just to decide whether to prompt for login.
    if (readTokens() === null) {
      openLoginModal();
      return;
    }
    setFormOpen(true);
  }

  async function submit() {
    setError(null);
    const body: ComplexInquiry = {};
    if (note.trim()) body.note = note.trim();
    if (unitId) body.unitId = unitId;
    try {
      await inquiry.mutateAsync(body);
      setFormOpen(false);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Yuborib bo'lmadi. Qaytadan urinib ko'ring.",
      );
    }
  }

  // Once sent, the CTA turns into a persistent confirmation instead of the button.
  if (inquiry.isSuccess) {
    return (
      <CtaShell className={className}>
        <p className="flex items-center justify-center gap-2 py-2 text-[14.5px] font-extrabold text-brand-green">
          <Icon name="check" className="h-4 w-4" strokeWidth={2.6} />
          So'rovingiz yuborildi
        </p>
      </CtaShell>
    );
  }

  return (
    <>
      <CtaShell className={className}>
        <button
          type="button"
          onClick={onCtaClick}
          className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark py-3.5 text-[15px] font-extrabold text-white shadow-lg shadow-accent/35"
        >
          <Icon name="phone" className="h-[17px] w-[17px]" strokeWidth={2.2} />
          So'rov yuborish
        </button>
      </CtaShell>

      {formOpen && (
        // Backdrop closes the form; the panel stops the click from bubbling.
        <div
          role="presentation"
          onClick={() => setFormOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="inquiry-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[400px] rounded-[18px] bg-card p-6 shadow-card"
          >
            <div className="flex items-start justify-between">
              <h2 id="inquiry-title" className="text-[19px] font-extrabold tracking-tight">
                So'rov yuborish
              </h2>
              <button
                type="button"
                aria-label="Yopish"
                onClick={() => setFormOpen(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-3 hover:bg-surface"
              >
                <Icon name="close" className="h-4 w-4" strokeWidth={2.4} />
              </button>
            </div>

            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
              Rieltor siz bilan bog'lanadi. Xohlasangiz, xonadonni tanlang va izoh qoldiring.
            </p>

            {units.length > 0 && (
              <div className="mt-5">
                <label
                  className="mb-2 block text-[13px] font-bold text-ink-2"
                  htmlFor="inquiry-unit"
                >
                  Xonadon (ixtiyoriy)
                </label>
                <select
                  id="inquiry-unit"
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  className="w-full rounded-[14px] border border-line bg-surface px-3.5 py-3 text-[15px] font-semibold outline-none"
                >
                  <option value="">Aniqlanmagan</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mt-4">
              <label className="mb-2 block text-[13px] font-bold text-ink-2" htmlFor="inquiry-note">
                Izoh (ixtiyoriy)
              </label>
              <textarea
                id="inquiry-note"
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 1000))}
                rows={3}
                placeholder="Masalan: 2 xonali, 3-4 qavat oralig'ida qidiryapman"
                className="w-full resize-none rounded-[14px] border border-line bg-surface px-3.5 py-3 text-[15px] font-medium outline-none placeholder:text-ink-3"
              />
            </div>

            {error && <p className="mt-3 text-[13px] font-semibold text-brand-rose">{error}</p>}

            <button
              type="button"
              disabled={inquiry.isPending}
              onClick={submit}
              className="mt-5 w-full rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark py-3.5 text-[15px] font-extrabold text-white shadow-lg shadow-accent/35 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {inquiry.isPending ? 'Yuborilmoqda...' : 'Yuborish'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
