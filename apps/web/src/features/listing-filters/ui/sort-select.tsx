import { useTranslation } from 'react-i18next';
import { Icon } from '@/shared/ui/icon';
import { SORT_OPTIONS, type Sort } from '../model/criteria';

interface Props {
  value: Sort;
  onChange: (sort: Sort) => void;
}

/**
 * A transparent <select> covers the whole pill: the look stays exactly as in the
 * mockup while the picker itself is native (iOS/Android show their own wheel).
 */
export function SortSelect({ value, onChange }: Props) {
  const { t } = useTranslation('feed');

  return (
    <div className="relative flex shrink-0 items-center gap-1.5 rounded-full bg-accent-soft px-3.5 py-2 text-[13px] font-bold whitespace-nowrap text-accent">
      {t('sortWithValue', { value: t(`sort.${value}`) })}
      <Icon name="chevronDown" className="h-3 w-3" strokeWidth={2.6} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Sort)}
        aria-label={t('sortAriaLabel')}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {SORT_OPTIONS.map((key) => (
          <option key={key} value={key}>
            {t(`sort.${key}`)}
          </option>
        ))}
      </select>
    </div>
  );
}
