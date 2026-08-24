import { cn } from '@/shared/lib/cn';
import type { ListingDraftState } from '../../model/use-listing-draft';
import { WizardNav } from '../wizard-nav';

const inputClass =
  'w-full rounded-[14px] border border-line bg-surface px-3.5 py-3 text-[14.5px] font-medium outline-none placeholder:text-ink-3 focus:border-accent';

const ROOM_OPTIONS = [1, 2, 3, 4, 5, 6];

interface Props {
  draft: ListingDraftState;
}

/** Step 3: rooms/area/floor plus the title and description — the wizard's only slot for the two, and both are required for submission (LISTING_REQUIRED_FIELDS). */
export function ParamsStep({ draft }: Props) {
  const { fields, patch, next, back, isSaving } = draft;

  // Mirrors ParamsRow (entities/listing): commercial premises have no room count, houses have no floor.
  const showRooms = fields.type !== 'COMMERCIAL';
  const showFloor = fields.type !== 'HOUSE';

  const canContinue = Boolean(
    fields.areaM2 &&
    fields.areaM2 > 0 &&
    (fields.title?.length ?? 0) >= 10 &&
    (fields.description?.length ?? 0) >= 20,
  );

  return (
    <div className="flex flex-col gap-4">
      {showRooms && (
        <div>
          <span className="mb-1.5 block text-[13.5px] font-bold text-ink-2">Xonalar soni</span>
          <div className="flex flex-wrap gap-2">
            {ROOM_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => patch({ rooms: n })}
                className={cn(
                  'h-10 w-10 rounded-[12px] border text-[14px] font-bold transition-colors',
                  fields.rooms === n
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
                (fields.rooms ?? 0) > 6
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-line text-ink-2 hover:bg-surface',
              )}
            >
              6+
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-[13.5px] font-bold text-ink-2">Maydon, m²</span>
          <input
            type="number"
            inputMode="decimal"
            min={1}
            value={fields.areaM2 ?? ''}
            onChange={(e) => patch({ areaM2: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="58"
            className={inputClass}
          />
        </label>

        {showFloor && (
          <label className="block">
            <span className="mb-1.5 block text-[13.5px] font-bold text-ink-2">Qavat</span>
            <input
              value={fields.floor ?? ''}
              onChange={(e) => patch({ floor: e.target.value || null })}
              placeholder="4/9"
              className={inputClass}
            />
          </label>
        )}
      </div>

      <label className="block">
        <span className="mb-1.5 block text-[13.5px] font-bold text-ink-2">Sarlavha</span>
        <input
          value={fields.title ?? ''}
          onChange={(e) => patch({ title: e.target.value })}
          placeholder="Masalan: Yunusobodda 3 xonali, yevroremont"
          maxLength={120}
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[13.5px] font-bold text-ink-2">Tavsif</span>
        <textarea
          value={fields.description ?? ''}
          onChange={(e) => patch({ description: e.target.value })}
          placeholder="Uy haqida batafsil yozing: holati, infratuzilma, qulayliklar..."
          rows={5}
          maxLength={4000}
          className={cn(inputClass, 'resize-none')}
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
