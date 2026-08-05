import { Icon } from '@/shared/ui/icon';
import { SORT_LABELS, type Sort } from '../model/criteria';

interface Props {
  value: Sort;
  onChange: (sort: Sort) => void;
}

/**
 * A transparent <select> covers the whole pill: the look stays exactly as in the
 * mockup while the picker itself is native (iOS/Android show their own wheel).
 */
export function SortSelect({ value, onChange }: Props) {
  return (
    <div className="relative flex shrink-0 items-center gap-1.5 rounded-full bg-accent-soft px-3.5 py-2 text-[13px] font-bold whitespace-nowrap text-accent">
      Saralash: {SORT_LABELS[value]}
      <Icon name="chevronDown" className="h-3 w-3" strokeWidth={2.6} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Sort)}
        aria-label="Saralash tartibi"
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {(Object.keys(SORT_LABELS) as Sort[]).map((key) => (
          <option key={key} value={key}>
            {SORT_LABELS[key]}
          </option>
        ))}
      </select>
    </div>
  );
}
