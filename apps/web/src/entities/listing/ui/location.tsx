import { useTranslation } from 'react-i18next';
import { Icon } from '@/shared/ui/icon';
import { StaticMap } from '@/shared/ui/static-map';

interface Props {
  landmark: string;
  address: string;
  /** Both null for a listing with no pin — then only the text is shown. */
  lat: number | null;
  lng: number | null;
  /** Used for the map's alt text. */
  title: string;
}

/**
 * Address and landmark as text, with a static map picture under them. The map is
 * a picture on purpose — the interactive API is reserved for the location picker
 * (spec §3.1), and tapping the image opens Yandex itself.
 */
export function Location({ landmark, address, lat, lng, title }: Props) {
  const { t } = useTranslation('feed');

  return (
    <>
      <p className="flex gap-2.5 text-[14.5px] leading-[1.4] font-semibold">
        <Icon name="pin" className="mt-0.5 h-4 w-4 text-accent" strokeWidth={2.2} />
        {address}
      </p>
      {/* Icon width + gap = 25px, so the landmark line aligns with the address above it. */}
      <p className="mt-1.5 pl-[25px] text-[13px] font-medium text-ink-3">
        {t('landmarkLabel', { landmark })}
      </p>
      {lat !== null && lng !== null && (
        <StaticMap point={{ lat, lng }} label={t('mapAlt', { title })} className="mt-3 block" />
      )}
    </>
  );
}
