import { LISTING_TYPE_META, LISTING_TYPES } from '@/entities/listing';
import { cn } from '@/shared/lib/cn';
import { MAX_ROOMS_BUCKET, type Criteria, type TypeFilter } from '../model/criteria';
import { parseNumberInput, parsePriceInput } from '../model/parse';

interface Props {
  value: Criteria;
  onChange: (next: Criteria) => void;
}

const ROOM_BUCKETS = [1, 2, 3, 4, MAX_ROOMS_BUCKET];

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'ALL', label: 'Barchasi' },
  ...LISTING_TYPES.map((t) => ({ value: t as TypeFilter, label: LISTING_TYPE_META[t].label })),
];

function Label({ children }: { children: string }) {
  return <p className="mb-2 text-[13px] font-bold text-ink-2">{children}</p>;
}

function RangeInput({
  placeholder,
  defaultText,
  onChange,
}: {
  placeholder: string;
  // Uncontrolled initial value (raw digits) so an AI-seeded price/area is visible
  // and editable, while free-text typing ("500 mln") is left untouched.
  defaultText?: string;
  onChange: (raw: string) => void;
}) {
  return (
    <input
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      aria-label={placeholder}
      defaultValue={defaultText}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl bg-surface px-3.5 py-3 text-sm font-semibold outline-none placeholder:font-medium placeholder:text-ink-3 focus:ring-2 focus:ring-accent/40"
    />
  );
}

export function FilterPanel({ value, onChange }: Props) {
  const patch = (next: Partial<Criteria>) => onChange({ ...value, ...next });

  return (
    <>
      <Label>Narx, so'm</Label>
      <div className="mb-4 flex gap-2">
        {/* "500 mln" / "1,5 mlrd" and raw digits are all understood. */}
        <RangeInput
          placeholder="dan · 500 mln"
          defaultText={value.priceMin != null ? String(value.priceMin) : undefined}
          onChange={(raw) => patch({ priceMin: parsePriceInput(raw) })}
        />
        <RangeInput
          placeholder="gacha · 1,5 mlrd"
          defaultText={value.priceMax != null ? String(value.priceMax) : undefined}
          onChange={(raw) => patch({ priceMax: parsePriceInput(raw) })}
        />
      </div>

      <Label>Xonalar soni</Label>
      <div className="mb-4 flex gap-2">
        {ROOM_BUCKETS.map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={value.rooms === n}
            // Tapping the selected bucket again clears it.
            onClick={() => patch({ rooms: value.rooms === n ? null : n })}
            className={cn(
              'flex-1 rounded-xl py-2.5 text-sm font-bold transition-colors',
              value.rooms === n ? 'bg-accent text-white' : 'bg-surface text-ink-2',
            )}
          >
            {n === MAX_ROOMS_BUCKET ? `${n}+` : n}
          </button>
        ))}
      </div>

      <Label>Maydon, m²</Label>
      <div className="mb-4 flex gap-2">
        <RangeInput
          placeholder="dan · 40"
          defaultText={value.areaMin != null ? String(value.areaMin) : undefined}
          onChange={(raw) => patch({ areaMin: parseNumberInput(raw) })}
        />
        <RangeInput
          placeholder="gacha · 120"
          defaultText={value.areaMax != null ? String(value.areaMax) : undefined}
          onChange={(raw) => patch({ areaMax: parseNumberInput(raw) })}
        />
      </div>

      <Label>Obyekt turi</Label>
      <div className="flex flex-wrap gap-2">
        {TYPE_OPTIONS.map(({ value: option, label }) => (
          <button
            key={option}
            type="button"
            aria-pressed={value.type === option}
            onClick={() => patch({ type: option })}
            className={cn(
              'rounded-xl px-3.5 py-2.5 text-sm font-bold transition-colors',
              value.type === option ? 'bg-accent text-white' : 'bg-surface text-ink-2',
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </>
  );
}
