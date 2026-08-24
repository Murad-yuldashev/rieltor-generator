import type { Deal } from '@rieltor/shared';
import { LISTING_TYPE_META, LISTING_TYPES } from '@/entities/listing';
import { cn } from '@/shared/lib/cn';
import type { ListingDraftState } from '../../model/use-listing-draft';
import { WizardNav } from '../wizard-nav';

const DEALS: { value: Deal; label: string }[] = [
  { value: 'SALE', label: 'Sotib olish' },
  { value: 'RENT', label: 'Ijara' },
];

function optionClass(active: boolean) {
  return cn(
    'rounded-[14px] border px-4 py-3.5 text-left text-[14.5px] font-bold transition-colors',
    active
      ? 'border-accent bg-accent-soft text-accent'
      : 'border-line bg-card text-ink-2 hover:bg-surface',
  );
}

interface Props {
  draft: ListingDraftState;
}

/** Step 1: deal (sale/rent) and property category — the two fields that shape everything downstream. */
export function DealStep({ draft }: Props) {
  const { fields, patch, next, isSaving } = draft;
  const canContinue = Boolean(fields.deal && fields.type);

  return (
    <div>
      <div>
        <p className="mb-2.5 text-[13.5px] font-bold text-ink-2">Bitim turi</p>
        <div role="tablist" aria-label="Bitim turi" className="grid grid-cols-2 gap-2.5">
          {DEALS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={fields.deal === value}
              onClick={() => patch({ deal: value })}
              className={optionClass(fields.deal === value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-2.5 text-[13.5px] font-bold text-ink-2">Obyekt turi</p>
        <div role="tablist" aria-label="Obyekt turi" className="grid grid-cols-2 gap-2.5">
          {LISTING_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              role="tab"
              aria-selected={fields.type === type}
              onClick={() => patch({ type })}
              className={optionClass(fields.type === type)}
            >
              {LISTING_TYPE_META[type].label}
            </button>
          ))}
        </div>
      </div>

      <WizardNav
        onNext={next}
        nextLabel="Davom etish"
        nextDisabled={!canContinue}
        isBusy={isSaving}
      />
    </div>
  );
}
