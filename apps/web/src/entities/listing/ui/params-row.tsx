import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from '@/shared/ui/icon';

interface Props {
  /** null for commercial premises. */
  rooms: number | null;
  areaM2: number;
  floor: string | null;
  district: string;
}

function Tile({ icon, value, label }: { icon: IconName; value: string; label: string }) {
  return (
    <li className="flex flex-col items-center gap-1.5 rounded-[13px] bg-surface px-1 py-3 text-center">
      <Icon name={icon} className="h-[19px] w-[19px] text-accent" />
      {/* The tile is narrow, so a long district like "Shayxontohur" shrinks and, at
          worst, wraps onto two lines — it never spills outside the tile. */}
      <b className="text-[clamp(11px,3.1vw,13.5px)] leading-tight font-extrabold break-words hyphens-auto">
        {value}
      </b>
      <small className="text-[10.5px] font-semibold text-ink-3">{label}</small>
    </li>
  );
}

export function ParamsRow({ rooms, areaM2, floor, district }: Props) {
  const { t } = useTranslation('feed');

  return (
    // grid-flow-col + auto-cols-fr makes the column count follow the number of tiles,
    // so the row still splits evenly when the floor tile drops out.
    <ul className="grid auto-cols-fr grid-flow-col gap-2">
      {/* Commercial premises have no room count — the tile drops out. */}
      {rooms !== null && (
        <Tile icon="rooms" value={String(rooms)} label={t('paramRoomsLabel')} />
      )}
      <Tile icon="area" value={`${areaM2} m²`} label={t('paramAreaLabel')} />
      {/* Houses have no floor — the tile drops out entirely. */}
      {floor !== null && <Tile icon="floor" value={floor} label={t('paramFloorLabel')} />}
      {/* The tile is narrow: "Yunusobod tumani" does not fit and "tumani" adds nothing. */}
      <Tile
        icon="pin"
        value={district.replace(/\s*tumani$/, '')}
        label={t('paramDistrictLabel')}
      />
    </ul>
  );
}
