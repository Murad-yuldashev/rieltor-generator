import { formatPriceSom } from '@rieltor/shared';
import type { ListingDraftState } from '../../model/use-listing-draft';
import { WizardNav } from '../wizard-nav';

const inputClass =
  'w-full rounded-[14px] border border-line bg-surface px-3.5 py-3 text-[14.5px] font-medium outline-none placeholder:text-ink-3 focus:border-accent';

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

interface Props {
  draft: ListingDraftState;
}

/** Step 5: price. Som is required (matches `priceSom` in LISTING_REQUIRED_FIELDS); USD is a nice-to-have. */
export function PriceStep({ draft }: Props) {
  const { fields, patch, next, back, isSaving } = draft;
  const deal = fields.deal ?? 'SALE';

  const canContinue = Boolean(
    fields.priceSom && /^\d+$/.test(fields.priceSom) && Number(fields.priceSom) > 0,
  );

  return (
    <div className="flex flex-col gap-4">
      <label className="block">
        <span className="mb-1.5 block text-[13.5px] font-bold text-ink-2">
          Narx, so'm{deal === 'RENT' ? ' (oyiga)' : ''}
        </span>
        <input
          inputMode="numeric"
          value={fields.priceSom ?? ''}
          onChange={(e) => patch({ priceSom: digitsOnly(e.target.value) || undefined })}
          placeholder="480000000"
          className={inputClass}
        />
        {fields.priceSom && Number(fields.priceSom) > 0 && (
          <span className="mt-1.5 block text-[12.5px] font-semibold text-ink-3">
            {formatPriceSom(fields.priceSom, deal)}
          </span>
        )}
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[13.5px] font-bold text-ink-2">Narx, $ (ixtiyoriy)</span>
        <input
          inputMode="numeric"
          value={fields.priceUsd ?? ''}
          onChange={(e) => {
            const digits = digitsOnly(e.target.value);
            patch({ priceUsd: digits ? Number(digits) : undefined });
          }}
          placeholder="38000"
          className={inputClass}
        />
      </label>

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
