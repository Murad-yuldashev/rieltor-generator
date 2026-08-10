interface Props {
  point: { lat: number; lng: number };
  /** Alt text; also what a screen reader announces for the link. */
  label: string;
  className?: string;
}

const ZOOM = 16;
/** Yandex caps a static image at 650×450; this fits a 360px column at 2x. */
const SIZE = '650,320';

/**
 * A picture of the map, not a map. Nothing is downloaded until the image scrolls
 * into view, and no JS API is loaded at all — the interactive map is reserved for
 * the location picker, where panning is the point. Tapping opens Yandex itself.
 */
export function StaticMap({ point, label, className }: Props) {
  const apiKey = import.meta.env.VITE_YANDEX_MAPS_KEY ?? '';
  if (!apiKey) return null;

  // Yandex orders coordinates longitude-first.
  const ll = `${point.lng},${point.lat}`;
  const params = new URLSearchParams({
    ll,
    z: String(ZOOM),
    size: SIZE,
    pt: `${ll},pm2rdm`,
    lang: 'ru_RU',
    apikey: apiKey,
  });

  return (
    <a
      href={`https://yandex.uz/maps/?pt=${ll}&z=${ZOOM}&l=map`}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      <img
        src={`https://static-maps.yandex.ru/v1?${params.toString()}`}
        alt={label}
        loading="lazy"
        width={650}
        height={320}
        className="h-auto w-full rounded-[12px] border border-line/60"
      />
    </a>
  );
}
