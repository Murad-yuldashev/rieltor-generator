import { useState } from 'react';
import { Link } from 'react-router';
import {
  formatPricePerM2,
  formatPriceSom,
  formatPriceUsd,
  TASHKENT_DISTRICTS,
  type ListingType,
} from '@rieltor/shared';
import { LISTING_TYPE_META, LISTING_TYPES } from '@/entities/listing';
import { TrackPropertyButton } from '@/features/track-property';
import { ApiError } from '@/shared/api/client';
import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';
import { SectionCard } from '@/shared/ui/section-card';
import { useValuation } from '../model/use-valuation';

/**
 * Mirrors the rate `apps/api/src/listings/listings.service.ts` uses to fill in
 * a missing `priceUsd` on listing submit. The valuation endpoint only returns
 * som figures — this is a client-only display convenience, never sent to the API.
 */
const SOM_PER_USD = 12650;

const ROOM_OPTIONS = [1, 2, 3, 4, 5, 6];

/** Below this many comparables the median is thin — the confidence line hedges with "taxminiy". */
const THIN_COMPARABLES = 5;

const inputClass =
  'w-full rounded-[14px] border border-line bg-surface px-3.5 py-3 text-[14.5px] font-medium outline-none placeholder:text-ink-3 focus:border-accent';

function optionClass(active: boolean) {
  return cn(
    'rounded-[14px] border px-4 py-3.5 text-left text-[14.5px] font-bold transition-colors',
    active
      ? 'border-accent bg-accent-soft text-accent'
      : 'border-line bg-card text-ink-2 hover:bg-surface',
  );
}

/** No SiteHeader/BottomNav — this route sits outside TabLayout, so a bare page needs at least a way back home. */
function TopBar() {
  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex max-w-[640px] items-center justify-between px-4 py-3.5">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-linear-to-br from-violet-600 to-accent-dark text-white">
            <Icon name="homeSolid" className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <span className="text-[15px] font-extrabold tracking-tight">
            Rieltor<span className="text-accent">App</span>
          </span>
        </Link>
        <Link
          to="/"
          aria-label="Yopish"
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-3 hover:bg-surface"
        >
          <Icon name="close" className="h-4 w-4" strokeWidth={2.2} />
        </Link>
      </div>
    </header>
  );
}

interface StepFooterProps {
  /** Omitted on the first step — there is nowhere to go back to. */
  onBack?: () => void;
  onNext: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
  isBusy?: boolean;
}

/** Back/continue footer shared by the two input steps. */
function StepFooter({ onBack, onNext, nextLabel, nextDisabled, isBusy }: StepFooterProps) {
  return (
    <div className="mt-6 flex items-center gap-3 border-t border-line pt-5">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          disabled={isBusy}
          className="rounded-[14px] border border-line px-5 py-3 text-[14.5px] font-bold text-ink-2 transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
        >
          Orqaga
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled || isBusy}
        className="ml-auto rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark px-6 py-3 text-[14.5px] font-extrabold text-white shadow-lg shadow-accent/35 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isBusy ? 'Hisoblanmoqda...' : nextLabel}
      </button>
    </div>
  );
}

/**
 * How many PUBLISHED listings actually backed the median — a thin sample gets a
 * softer, hedged line. Only rendered when `count > 0`; the zero case has its own
 * empty state upstream and never reaches here.
 */
function ConfidenceLine({ count }: { count: number }) {
  const isThin = count < THIN_COMPARABLES;
  return (
    <p className={cn('text-[13px] font-semibold', isThin ? 'text-brand-amber' : 'text-ink-2')}>
      {count} ta o'xshash sotuv e'loniga asoslangan{isThin && ' — taxminiy'}
    </p>
  );
}

/** The two calls to action shown under any result — list a property, or talk to a realtor. */
function ResultActions({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="mt-6 flex flex-col gap-2.5">
      <Link
        to="/my/listings/new"
        className="rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark px-5 py-3.5 text-[14.5px] font-extrabold text-white shadow-lg shadow-accent/35"
      >
        E'lon joylash
      </Link>
      <Link
        to="/contact"
        className="rounded-[14px] border border-line px-5 py-3.5 text-[14.5px] font-bold text-ink-2 transition-colors hover:bg-surface"
      >
        Rieltor bilan bog'lanish
      </Link>
      <button
        type="button"
        onClick={onRestart}
        className="mt-1 text-[13px] font-bold text-ink-3 hover:text-ink-2"
      >
        Boshqa parametr bilan hisoblash
      </button>
    </div>
  );
}

interface FormState {
  type: ListingType | undefined;
  district: string | undefined;
  rooms: number | null;
  areaM2: number | undefined;
}

const INITIAL_STATE: FormState = {
  type: undefined,
  district: undefined,
  rooms: null,
  areaM2: undefined,
};

/**
 * The flagship seller-capture hook (spec A21): three quick questions, then a
 * free estimate with two calls to action. Own light chrome, no bottom-nav
 * dependency — a seller landing here from an ad shouldn't have to parse the
 * full site nav first. Public route, no auth.
 */
export function ValuationPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const { estimate, result, isPending, error, reset } = useValuation();

  function patch(next: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...next }));
  }

  // Commercial premises have no room count — mirrors the listing wizard's ParamsStep.
  const showRooms = form.type !== 'COMMERCIAL';
  const canContinueStep0 = Boolean(form.type && form.district);
  const canSubmit = Boolean(form.areaM2 && form.areaM2 > 0);

  async function handleEstimate() {
    if (!form.type || !form.district || !form.areaM2) return;
    try {
      await estimate({
        type: form.type,
        district: form.district,
        rooms: showRooms ? form.rooms : null,
        areaM2: form.areaM2,
      });
      setStep(2);
    } catch {
      // The error banner below the button already reflects the failure.
    }
  }

  function handleRestart() {
    setForm(INITIAL_STATE);
    reset();
    setStep(0);
  }

  return (
    <div className="min-h-dvh bg-surface">
      <TopBar />

      <main className="mx-auto max-w-[640px] px-4 py-6 desk:py-12">
        <div className="mb-5 text-center desk:mb-8">
          <h1 className="text-[22px] leading-tight font-extrabold tracking-tight desk:text-[28px]">
            Uyingiz qancha turadi? 🏡
          </h1>
          <p className="mt-1.5 text-[13.5px] text-ink-2 desk:text-[15px]">
            3 ta savolga javob bering — bozor narxiga asoslangan bepul taxminiy baho oling
          </p>
        </div>

        <SectionCard className="desk:p-7">
          {step < 2 && (
            <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-linear-to-r from-violet-600 to-accent-dark transition-[width] duration-300"
                style={{ width: `${((step + 1) / 2) * 100}%` }}
              />
            </div>
          )}

          {step === 0 && (
            <div>
              <div>
                <p className="mb-2.5 text-[13.5px] font-bold text-ink-2">Obyekt turi</p>
                <div role="tablist" aria-label="Obyekt turi" className="grid grid-cols-2 gap-2.5">
                  {LISTING_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      role="tab"
                      aria-selected={form.type === type}
                      onClick={() => patch({ type })}
                      className={optionClass(form.type === type)}
                    >
                      {LISTING_TYPE_META[type].label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="mt-5 block">
                <span className="mb-2.5 block text-[13.5px] font-bold text-ink-2">Tuman</span>
                <select
                  value={form.district ?? ''}
                  onChange={(e) => patch({ district: e.target.value || undefined })}
                  className={inputClass}
                >
                  <option value="" disabled>
                    Tumanni tanlang
                  </option>
                  {TASHKENT_DISTRICTS.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </label>

              <StepFooter
                onNext={() => setStep(1)}
                nextLabel="Davom etish"
                nextDisabled={!canContinueStep0}
              />
            </div>
          )}

          {step === 1 && (
            <div>
              {showRooms && (
                <div>
                  <span className="mb-2.5 block text-[13.5px] font-bold text-ink-2">
                    Xonalar soni
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {ROOM_OPTIONS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => patch({ rooms: n })}
                        className={cn(
                          'h-10 w-10 rounded-[12px] border text-[14px] font-bold transition-colors',
                          form.rooms === n
                            ? 'border-accent bg-accent-soft text-accent'
                            : 'border-line text-ink-2 hover:bg-surface',
                        )}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => patch({ rooms: 7 })}
                      className={cn(
                        'rounded-[12px] border px-3 text-[13px] font-bold transition-colors',
                        (form.rooms ?? 0) > 6
                          ? 'border-accent bg-accent-soft text-accent'
                          : 'border-line text-ink-2 hover:bg-surface',
                      )}
                    >
                      6+
                    </button>
                  </div>
                </div>
              )}

              <label className={cn('block', showRooms && 'mt-5')}>
                <span className="mb-2.5 block text-[13.5px] font-bold text-ink-2">Maydon, m²</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={1}
                  value={form.areaM2 ?? ''}
                  onChange={(e) =>
                    patch({ areaM2: e.target.value ? Number(e.target.value) : undefined })
                  }
                  placeholder="58"
                  className={inputClass}
                />
              </label>

              {error && (
                <p className="mt-3 text-[13px] font-semibold text-brand-rose">
                  {error instanceof ApiError
                    ? error.message
                    : "Bahoni hisoblab bo'lmadi. Qaytadan urinib ko'ring."}
                </p>
              )}

              <StepFooter
                onBack={() => setStep(0)}
                onNext={handleEstimate}
                nextLabel="Bahoni ko'rish"
                nextDisabled={!canSubmit}
                isBusy={isPending}
              />
            </div>
          )}

          {/* With no PUBLISHED sale listings for this type at all, the median is 0 —
              showing "0 so'm" reads as broken, so the zero-comparables case gets its
              own honest empty state instead of a bogus figure. Expected early in a new
              region, where the closed loop is only just filling up. */}
          {step === 2 && result && result.comparablesCount === 0 && (
            <div className="text-center">
              <p className="text-[40px]">🔍</p>
              <p className="mt-2 text-[18px] font-extrabold tracking-tight">
                Hozircha aniq baho yo'q
              </p>
              <p className="mx-auto mt-2 max-w-[420px] text-[14px] leading-relaxed text-ink-2">
                Bu tur va tuman bo'yicha bozorimizda hali sotuvdagi o'xshash e'lonlar yo'q. Boshqa
                parametr bilan urinib ko'ring yoki rieltorimiz aniq baho bersin.
              </p>
              <ResultActions onRestart={handleRestart} />
            </div>
          )}

          {step === 2 && result && result.comparablesCount > 0 && (
            <div className="text-center">
              <p className="text-[13.5px] font-bold text-ink-2">Taxminiy narx</p>
              <p className="mt-1.5 text-[clamp(26px,7vw,34px)] leading-tight font-extrabold tracking-tight text-accent-dark">
                {formatPriceSom(result.estimateSom, 'SALE')}
              </p>
              <p className="mt-1 text-[15px] font-bold text-ink-3">
                ≈ {formatPriceUsd(Math.round(Number(result.estimateSom) / SOM_PER_USD), 'SALE')}
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[13px] font-semibold text-ink-2">
                <span>
                  {formatPriceSom(result.lowSom, 'SALE')} – {formatPriceSom(result.highSom, 'SALE')}
                </span>
                {form.areaM2 && (
                  <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent">
                    {formatPricePerM2(result.estimateSom, form.areaM2)}
                  </span>
                )}
              </div>

              <div className="mt-3">
                <ConfidenceLine count={result.comparablesCount} />
              </div>

              <p className="mt-4 text-left text-[14px] leading-relaxed text-ink-2">
                {result.explanation}
              </p>

              {/* Retention loop: save this valuation to "Mening uyim" so its modeled
                  price history keeps updating. Only offered once we have real
                  comparables — the zero-comparable branch has no figure worth tracking. */}
              <TrackPropertyButton
                params={{
                  type: form.type!,
                  district: form.district!,
                  rooms: showRooms ? form.rooms : null,
                  areaM2: form.areaM2!,
                }}
              />

              <ResultActions onRestart={handleRestart} />
            </div>
          )}
        </SectionCard>
      </main>
    </div>
  );
}
