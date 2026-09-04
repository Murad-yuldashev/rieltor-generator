import {
  formatPriceSom,
  type PublicBuilding,
  type PublicUnit,
  type UnitStatus,
} from '@rieltor/shared';
import { cn } from '@/shared/lib/cn';

/**
 * The public shaxmatka is read-only: the DTO carries only a unit's `status`, never
 * any booking or client data, so a buyer sees availability and price but nothing
 * about who holds a unit. The three colours mirror the CRM grid's language
 * (green = free, amber = held, red = sold) without importing anything from the CRM.
 */
const CHIP: Record<UnitStatus, { cls: string; label: string }> = {
  AVAILABLE: { cls: 'border-brand-green/30 bg-brand-green/10 text-brand-green', label: "bo'sh" },
  BOOKED: { cls: 'border-brand-amber/30 bg-brand-amber/10 text-brand-amber', label: 'band' },
  SOLD: { cls: 'border-brand-rose/30 bg-brand-rose/10 text-brand-rose', label: 'sotilgan' },
};

/** One unit tile: number, its room/area mix when known, and the sale price when set. */
function UnitChip({ unit }: { unit: PublicUnit }) {
  const chip = CHIP[unit.status];
  const mix = [
    unit.rooms != null ? `${unit.rooms} xona` : null,
    unit.areaM2 != null ? `${unit.areaM2} m²` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className={cn('rounded-lg border px-2 py-1.5 text-center', chip.cls)}>
      <span className="block text-[13px] font-extrabold tracking-tight">{unit.number}</span>
      {mix && <span className="mt-0.5 block text-[10.5px] font-semibold opacity-90">{mix}</span>}
      {unit.priceSom != null && (
        <span className="mt-0.5 block text-[10.5px] font-bold">
          {formatPriceSom(unit.priceSom, 'SALE')}
        </span>
      )}
      <span className="mt-1 block text-[9.5px] font-bold tracking-wide uppercase opacity-80">
        {chip.label}
      </span>
    </div>
  );
}

/** Groups a building's units by floor (descending) — the classic shaxmatka layout. */
function floorRows(units: PublicUnit[]): { floor: number; units: PublicUnit[] }[] {
  const byFloor = new Map<number, PublicUnit[]>();
  for (const unit of units) {
    const row = byFloor.get(unit.floor);
    if (row) row.push(unit);
    else byFloor.set(unit.floor, [unit]);
  }
  return [...byFloor.entries()]
    .sort(([a], [b]) => b - a)
    .map(([floor, rowUnits]) => ({
      floor,
      units: [...rowUnits].sort((a, b) =>
        a.number.localeCompare(b.number, undefined, { numeric: true }),
      ),
    }));
}

/** The whole availability panel — every building, floor by floor. */
export function AvailabilityGrid({ buildings }: { buildings: PublicBuilding[] }) {
  const hasUnits = buildings.some((b) => b.units.length > 0);

  if (!hasUnits) {
    return <p className="text-[14px] text-ink-2">Hozircha xonadonlar ma'lumoti yo'q.</p>;
  }

  return (
    <div className="space-y-6">
      {/* Legend so the colour language reads without prior context. */}
      <div className="flex flex-wrap gap-3">
        {(Object.keys(CHIP) as UnitStatus[]).map((status) => (
          <span
            key={status}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-2"
          >
            <span className={cn('h-3 w-3 rounded-full border', CHIP[status].cls)} />
            {CHIP[status].label}
          </span>
        ))}
      </div>

      {buildings.map((building) => {
        if (building.units.length === 0) return null;
        return (
          <div key={building.id}>
            <h3 className="mb-2.5 text-[14px] font-extrabold tracking-tight">
              {building.name}
              {building.floors != null && (
                <span className="ml-2 text-[12px] font-semibold text-ink-3">
                  {building.floors} qavat
                </span>
              )}
            </h3>

            <div className="space-y-2">
              {floorRows(building.units).map(({ floor, units }) => (
                <div key={floor} className="flex items-start gap-2.5">
                  <span className="mt-2 w-6 shrink-0 text-right text-[12px] font-bold text-ink-3">
                    {floor}
                  </span>
                  <div className="grid flex-1 grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-6">
                    {units.map((unit) => (
                      <UnitChip key={unit.id} unit={unit} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
