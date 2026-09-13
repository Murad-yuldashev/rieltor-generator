import { lazy, Suspense } from 'react';
import type { ListingDraftState } from '../../model/use-listing-draft';
import { WizardNav } from '../wizard-nav';

const PinMap = lazy(() => import('@/shared/ui/map/pin-map'));

const inputClass =
  'w-full rounded-[14px] border border-line bg-surface px-3.5 py-3 text-[14.5px] font-medium outline-none placeholder:text-ink-3 focus:border-accent';

interface Props {
  draft: ListingDraftState;
}

/** Step 2: address as plain text plus an optional map pin-picker (writes latitude/longitude to the draft). */
export function LocationStep({ draft }: Props) {
  const { fields, patch, next, back, isSaving } = draft;

  const canContinue = Boolean(
    (fields.district?.length ?? 0) >= 2 &&
    (fields.address?.length ?? 0) >= 4 &&
    (fields.landmark?.length ?? 0) >= 2,
  );

  return (
    <div className="flex flex-col gap-4">
      <label className="block">
        <span className="mb-1.5 block text-[13.5px] font-bold text-ink-2">Tuman / shahar</span>
        <input
          value={fields.district ?? ''}
          onChange={(e) => patch({ district: e.target.value })}
          placeholder="Masalan: Yunusobod tumani"
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[13.5px] font-bold text-ink-2">To'liq manzil</span>
        <input
          value={fields.address ?? ''}
          onChange={(e) => patch({ address: e.target.value })}
          placeholder="Ko'cha, uy raqami"
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[13.5px] font-bold text-ink-2">Yaqin mo'ljal</span>
        <input
          value={fields.landmark ?? ''}
          onChange={(e) => patch({ landmark: e.target.value })}
          placeholder="Masalan: Metro «Shahriston» 10 daq."
          className={inputClass}
        />
      </label>

      <div className="mt-4">
        <p className="mb-1.5 text-[13px] font-bold text-ink-2">
          Xaritada joyni belgilang (ixtiyoriy)
        </p>
        <Suspense fallback={<div className="h-[320px] w-full rounded-card bg-surface" />}>
          <PinMap
            mode="pick"
            lat={fields.latitude ?? null}
            lng={fields.longitude ?? null}
            onPick={(latitude, longitude) => patch({ latitude, longitude })}
            className="h-[320px] w-full overflow-hidden rounded-card border border-line"
          />
        </Suspense>
        {fields.latitude != null && (
          <p className="mt-1.5 text-[12px] font-semibold text-ink-3">
            Belgilandi: {fields.latitude.toFixed(4)}, {fields.longitude?.toFixed(4)}
          </p>
        )}
      </div>

      <WizardNav
        onBack={back}
        onNext={next}
        nextLabel="Davom etish"
        nextDisabled={!canContinue}
        isBusy={isSaving}
      />
    </div>
  );
}
