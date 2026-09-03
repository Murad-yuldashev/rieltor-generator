import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { formatPriceSom, type Unit, type UnitStatus } from '@rieltor/shared';
import { useBookUnit, useBookingAction, useBulkUpdateUnits } from '@/features/booking';
import {
  UNIT_STATUS_BADGE,
  UNIT_STATUS_LABELS,
  UNIT_STATUS_OPTIONS,
  useCreateUnit,
  useDeleteBuilding,
  useDeleteUnit,
  useUnits,
  useUpdateBuilding,
  useUpdateUnit,
} from '@/features/developer';
import { CabinetNav } from '@/widgets/cabinet-nav';
import { cn } from '@/shared/lib/cn';

const SHELL = 'mx-auto flex min-h-dvh max-w-content flex-col gap-5 bg-surface px-5 py-8';
const FIELD =
  'mt-1.5 w-full rounded-[14px] border border-line bg-surface px-4 py-3 text-[15px] text-ink outline-none focus:border-accent';
const LABEL = 'block text-[13px] font-semibold text-ink-2';
const CELL = 'whitespace-nowrap px-3 py-2.5 text-[13px] text-ink';
const HEAD = 'whitespace-nowrap px-3 py-2.5 text-left text-[12px] font-semibold text-ink-3';
const TABLE_INPUT =
  'w-full min-w-[72px] rounded-[10px] border border-line bg-surface px-2 py-1.5 text-[13px] text-ink outline-none focus:border-accent';
const PANEL_INPUT =
  'mt-1 w-full rounded-[12px] border border-line bg-surface px-3 py-2 text-[14px] text-ink outline-none focus:border-accent';

/** Shaxmatka cell tint per status — a bordered colour block for the floor grid. */
const CELL_TONE: Record<UnitStatus, string> = {
  AVAILABLE: 'border-brand-green/30 bg-brand-green/10 text-brand-green',
  BOOKED: 'border-brand-amber/40 bg-brand-amber/15 text-brand-amber',
  SOLD: 'border-brand-rose/30 bg-brand-rose/10 text-brand-rose',
};

/** Group units into floor rows, top floor first, each row ordered by number. */
function groupUnitsByFloorDesc(units: Unit[]): { floor: number; rowUnits: Unit[] }[] {
  const byFloor = new Map<number, Unit[]>();
  for (const unit of units) {
    const bucket = byFloor.get(unit.floor);
    if (bucket) bucket.push(unit);
    else byFloor.set(unit.floor, [unit]);
  }
  return [...byFloor.entries()]
    .sort(([a], [b]) => b - a)
    .map(([floor, rowUnits]) => ({
      floor,
      rowUnits: [...rowUnits].sort((a, b) =>
        a.number.localeCompare(b.number, undefined, { numeric: true }),
      ),
    }));
}

/**
 * Building detail (`/buildings/:id`). The parent complex id is not derivable from
 * a unit (units carry only their building), so it rides along as a `?complex=`
 * query param set by the link on the complex-detail page. It is optional: a direct
 * visit without it still lists and edits units — only the "back to this complex"
 * link and post-delete redirect fall back to the complexes index.
 */
export function BuildingDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const complexId = searchParams.get('complex') ?? '';
  const backTo = complexId ? `/complexes/${complexId}` : '/complexes';

  const { data: units, isPending, isError } = useUnits(id);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  // Bulk-edit mode: the same cells become a multi-select. `selectMode` swaps the
  // click behaviour (toggle membership instead of opening the panel); `selectedIds`
  // holds the chosen units for `PATCH /api/crm/units/bulk`.
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Derive the selected unit from the live list (not a stored copy) so it always
  // reflects the latest refetch — a booking action recolours the cell AND updates
  // the open panel's status-conditional actions.
  const selectedUnit = units?.find((unit) => unit.id === selectedUnitId) ?? null;
  const hasUnits = !isPending && !isError && !!units && units.length > 0;

  function toggleSelectMode() {
    setSelectMode((on) => {
      const next = !on;
      // Entering select mode closes the single-cell panel; leaving it clears the
      // multi-selection so the two modes never carry state into each other.
      if (next) setSelectedUnitId(null);
      else setSelectedIds(new Set());
      return next;
    });
  }

  function toggleUnitSelected(unitId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return next;
    });
  }

  return (
    <main className={SHELL}>
      <CabinetNav />
      <Link to={backTo} className="text-[13px] font-semibold text-accent">
        &lsaquo; Majmuaga qaytish
      </Link>

      <section className="rounded-card bg-card p-5 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-[18px] font-extrabold tracking-tight text-ink">Shaxmatka</h1>
          {hasUnits && (
            <button
              type="button"
              onClick={toggleSelectMode}
              className={cn(
                'shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                selectMode
                  ? 'border-accent bg-accent text-white'
                  : 'border-line bg-surface text-ink-2',
              )}
            >
              {selectMode ? 'Tanlashni yakunlash' : 'Tanlash'}
            </button>
          )}
        </div>
        <StatusLegend />

        {isPending ? (
          <p className="mt-4 text-[15px] font-semibold text-ink-2">Yuklanmoqda...</p>
        ) : isError || !units ? (
          <p className="mt-4 text-[14px] font-semibold text-brand-rose">
            Xonadonlarni yuklab bo'lmadi. Qayta urinib ko'ring.
          </p>
        ) : units.length === 0 ? (
          <p className="mt-4 text-[14px] text-ink-3">Hozircha xonadon yo'q</p>
        ) : (
          <>
            {selectMode && (
              <BulkEditBar
                buildingId={id}
                unitIds={[...selectedIds]}
                onClear={() => setSelectedIds(new Set())}
              />
            )}
            <ShaxmatkaGrid
              units={units}
              selectMode={selectMode}
              selectedUnitId={selectedUnitId}
              selectedIds={selectedIds}
              onSelect={setSelectedUnitId}
              onToggleSelect={toggleUnitSelected}
            />
            {!selectMode && selectedUnit && (
              <CellPanel
                key={selectedUnit.id}
                buildingId={id}
                unit={selectedUnit}
                onClose={() => setSelectedUnitId(null)}
              />
            )}
          </>
        )}
      </section>

      {!isPending && !isError && units && units.length > 0 && (
        <section className="rounded-card bg-card p-5 shadow-card">
          <h2 className="text-[15px] font-bold text-ink">Xonadonlar ro'yxati</h2>
          <UnitsTable buildingId={id} units={units} />
        </section>
      )}

      <AddUnitForm buildingId={id} />
      <BuildingSettings buildingId={id} complexId={complexId} backTo={backTo} />
    </main>
  );
}

/** The colour key for the three unit statuses. */
function StatusLegend() {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {UNIT_STATUS_OPTIONS.map((status) => (
        <span
          key={status}
          className={cn(
            'rounded-full px-2.5 py-1 text-[12px] font-semibold',
            UNIT_STATUS_BADGE[status],
          )}
        >
          {UNIT_STATUS_LABELS[status]}
        </span>
      ))}
    </div>
  );
}

/**
 * The shaxmatka: one row per floor (top floor first), each row a horizontal strip
 * of status-coloured unit cells. Scrolls sideways on narrow screens so a wide floor
 * never squeezes the page.
 */
function ShaxmatkaGrid({
  units,
  selectMode,
  selectedUnitId,
  selectedIds,
  onSelect,
  onToggleSelect,
}: {
  units: Unit[];
  selectMode: boolean;
  selectedUnitId: string | null;
  selectedIds: Set<string>;
  onSelect: (unitId: string) => void;
  onToggleSelect: (unitId: string) => void;
}) {
  const floors = groupUnitsByFloorDesc(units);

  return (
    <div className="mt-4 overflow-x-auto">
      <div className="flex w-max min-w-full flex-col gap-2">
        {floors.map(({ floor, rowUnits }) => (
          <div key={floor} className="flex items-stretch gap-2">
            <div className="flex w-10 shrink-0 items-center justify-end pr-1 text-[12px] font-semibold text-ink-3">
              {floor}
            </div>
            <div className="flex gap-2">
              {rowUnits.map((unit) => (
                <ShaxmatkaCell
                  key={unit.id}
                  unit={unit}
                  selectMode={selectMode}
                  selected={selectMode ? selectedIds.has(unit.id) : unit.id === selectedUnitId}
                  onSelect={onSelect}
                  onToggleSelect={onToggleSelect}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * One shaxmatka cell — number on top, status/client label below, tinted by status.
 * In select mode a click toggles the cell's membership in the bulk selection
 * (marked by a check badge) instead of opening the detail panel.
 */
function ShaxmatkaCell({
  unit,
  selectMode,
  selected,
  onSelect,
  onToggleSelect,
}: {
  unit: Unit;
  selectMode: boolean;
  selected: boolean;
  onSelect: (unitId: string) => void;
  onToggleSelect: (unitId: string) => void;
}) {
  const subtitle =
    unit.status === 'BOOKED'
      ? (unit.activeBooking?.clientName ?? UNIT_STATUS_LABELS.BOOKED)
      : UNIT_STATUS_LABELS[unit.status];

  return (
    <button
      type="button"
      aria-pressed={selectMode ? selected : undefined}
      onClick={() => (selectMode ? onToggleSelect(unit.id) : onSelect(unit.id))}
      className={cn(
        'relative flex h-16 w-20 shrink-0 flex-col items-start justify-between rounded-[12px] border px-2 py-1.5 text-left transition',
        CELL_TONE[unit.status],
        selected && 'ring-2 ring-accent ring-offset-1 ring-offset-card',
      )}
    >
      {selectMode && (
        <span
          aria-hidden
          className={cn(
            'absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-[6px] border text-[10px] font-bold leading-none',
            selected ? 'border-accent bg-accent text-white' : 'border-current bg-card/70',
          )}
        >
          {selected ? '✓' : ''}
        </span>
      )}
      <span className="text-[14px] font-bold leading-none">{unit.number}</span>
      <span className="w-full truncate text-[11px] font-semibold leading-tight opacity-80">
        {subtitle}
      </span>
    </button>
  );
}

/**
 * The bulk-edit bar shown while select mode is on. Applies a status and/or a price
 * to every selected unit at once. Booked units are skipped server-side; when any
 * are, we surface how many were left unchanged. On success the selection clears
 * (the grid refetches to the new colours) while the bar stays open for more edits.
 */
function BulkEditBar({
  buildingId,
  unitIds,
  onClear,
}: {
  buildingId: string;
  unitIds: string[];
  onClear: () => void;
}) {
  const bulk = useBulkUpdateUnits(buildingId);
  const [status, setStatus] = useState<UnitStatus | ''>('');
  const [priceSom, setPriceSom] = useState('');

  const hasChange = status !== '' || priceSom.trim().length > 0;
  const canApply = unitIds.length > 0 && hasChange && !bulk.isPending;

  async function handleApply() {
    if (!canApply) return;
    await bulk.mutateAsync({
      unitIds,
      status: status === '' ? undefined : status,
      priceSom: priceSom.trim() ? priceSom.trim() : undefined,
    });
    onClear();
    setStatus('');
    setPriceSom('');
  }

  const skipped = bulk.data?.skippedBooked ?? 0;

  return (
    <div className="mt-4 rounded-card border border-accent/40 bg-accent-soft/40 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="text-[13px] font-semibold text-ink-2">
          Tanlangan: <span className="font-extrabold text-ink">{unitIds.length}</span>
        </div>
        <label className="block">
          <span className={LABEL}>Holat</span>
          <select
            aria-label="Holat"
            value={status}
            onChange={(event) => setStatus(event.target.value as UnitStatus | '')}
            className={PANEL_INPUT}
          >
            <option value="">O'zgartirmaslik</option>
            {UNIT_STATUS_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {UNIT_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={LABEL}>Narx, so'm</span>
          <input
            inputMode="numeric"
            value={priceSom}
            onChange={(event) => setPriceSom(event.target.value.replace(/\D/g, ''))}
            placeholder="O'zgartirmaslik"
            className={PANEL_INPUT}
          />
        </label>
        <button
          type="button"
          onClick={handleApply}
          disabled={!canApply}
          className="rounded-[12px] bg-accent px-4 py-2.5 text-[14px] font-extrabold text-white disabled:opacity-60"
        >
          {bulk.isPending ? 'Qo‘llanmoqda...' : "Qo'llash"}
        </button>
      </div>

      {bulk.isSuccess && skipped > 0 && (
        <p className="mt-2 text-[13px] font-semibold text-brand-amber">
          {skipped} ta band xonadonning statusi o'zgartirilmadi
        </p>
      )}
      {bulk.isError && (
        <p className="mt-2 text-[13px] font-semibold text-brand-rose">
          Qo'llashda xatolik. Qayta urinib ko'ring.
        </p>
      )}
    </div>
  );
}

/**
 * The cell detail panel: the selected unit's editable fields plus its
 * status-conditional booking controls (book / cancel / convert).
 */
function CellPanel({
  buildingId,
  unit,
  onClose,
}: {
  buildingId: string;
  unit: Unit;
  onClose: () => void;
}) {
  return (
    <div className="mt-5 rounded-card border border-line bg-surface p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-[16px] font-extrabold text-ink">Xonadon {unit.number}</h2>
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-[12px] font-semibold',
              UNIT_STATUS_BADGE[unit.status],
            )}
          >
            {UNIT_STATUS_LABELS[unit.status]}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Yopish"
          className="rounded-[10px] border border-line px-2.5 py-1 text-[13px] font-semibold text-ink-2"
        >
          ✕
        </button>
      </div>

      <UnitEditForm buildingId={buildingId} unit={unit} />

      <div className="mt-4 border-t border-line pt-4">
        {unit.status === 'AVAILABLE' && <BookForm buildingId={buildingId} unitId={unit.id} />}
        {unit.status === 'BOOKED' && <BookedActions buildingId={buildingId} unit={unit} />}
        {unit.status === 'SOLD' && (
          <p className="text-[13px] font-semibold text-ink-3">Bu xonadon sotilgan.</p>
        )}
      </div>
    </div>
  );
}

/** Editable unit fields inside the panel — reuses `useUpdateUnit` (5.1). */
function UnitEditForm({ buildingId, unit }: { buildingId: string; unit: Unit }) {
  const update = useUpdateUnit(buildingId);

  const [number, setNumber] = useState(unit.number);
  const [floor, setFloor] = useState(String(unit.floor));
  const [rooms, setRooms] = useState(unit.rooms != null ? String(unit.rooms) : '');
  const [areaM2, setAreaM2] = useState(unit.areaM2 != null ? String(unit.areaM2) : '');
  const [priceSom, setPriceSom] = useState(unit.priceSom ?? '');

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedNumber = number.trim();
    if (!trimmedNumber) return;
    await update.mutateAsync({
      unitId: unit.id,
      number: trimmedNumber,
      floor: Number(floor) || 0,
      rooms: rooms.trim() ? Number(rooms) : undefined,
      areaM2: areaM2.trim() ? Number(areaM2) : undefined,
      priceSom: priceSom.trim() ? priceSom.trim() : undefined,
    });
  }

  return (
    <form onSubmit={handleSave} className="mt-4 grid grid-cols-2 gap-3">
      <label className="block">
        <span className={LABEL}>Raqam</span>
        <input
          value={number}
          onChange={(event) => setNumber(event.target.value)}
          maxLength={40}
          className={PANEL_INPUT}
        />
      </label>
      <label className="block">
        <span className={LABEL}>Qavat</span>
        <input
          type="number"
          min={0}
          max={200}
          value={floor}
          onChange={(event) => setFloor(event.target.value)}
          className={PANEL_INPUT}
        />
      </label>
      <label className="block">
        <span className={LABEL}>Xonalar</span>
        <input
          type="number"
          min={0}
          max={50}
          value={rooms}
          onChange={(event) => setRooms(event.target.value)}
          placeholder="Ixtiyoriy"
          className={PANEL_INPUT}
        />
      </label>
      <label className="block">
        <span className={LABEL}>Maydon, m²</span>
        <input
          type="number"
          min={0}
          step="0.1"
          value={areaM2}
          onChange={(event) => setAreaM2(event.target.value)}
          placeholder="Ixtiyoriy"
          className={PANEL_INPUT}
        />
      </label>
      <label className="col-span-2 block">
        <span className={LABEL}>Narx, so'm</span>
        <input
          inputMode="numeric"
          value={priceSom}
          onChange={(event) => setPriceSom(event.target.value.replace(/\D/g, ''))}
          placeholder="Ixtiyoriy"
          className={PANEL_INPUT}
        />
      </label>

      <button
        type="submit"
        disabled={update.isPending || number.trim().length === 0}
        className="col-span-2 mt-1 rounded-[12px] border border-accent bg-accent-soft px-4 py-2.5 text-[14px] font-bold text-accent disabled:opacity-60"
      >
        {update.isPending ? 'Saqlanmoqda...' : 'Maʼlumotlarni saqlash'}
      </button>

      {update.isError && (
        <p className="col-span-2 text-[13px] font-semibold text-brand-rose">
          Saqlashda xatolik. Qayta urinib ko'ring.
        </p>
      )}
    </form>
  );
}

/** The "Band qilish" form shown for an AVAILABLE unit. */
function BookForm({ buildingId, unitId }: { buildingId: string; unitId: string }) {
  const book = useBookUnit(buildingId);

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [holdDays, setHoldDays] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) return;
    // On success the unit flips to BOOKED and the panel re-renders into BookedActions.
    await book.mutateAsync({
      unitId,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      holdDays: holdDays.trim() ? Number(holdDays) : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3 className="text-[14px] font-bold text-ink">Band qilish</h3>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="block">
          <span className={LABEL}>Mijoz ismi</span>
          <input
            value={clientName}
            onChange={(event) => setClientName(event.target.value)}
            maxLength={120}
            className={PANEL_INPUT}
          />
        </label>
        <label className="block">
          <span className={LABEL}>Telefon</span>
          <input
            value={clientPhone}
            onChange={(event) => setClientPhone(event.target.value)}
            maxLength={30}
            placeholder="+998..."
            className={PANEL_INPUT}
          />
        </label>
        <label className="col-span-2 block">
          <span className={LABEL}>Band muddati (kun)</span>
          <input
            type="number"
            min={1}
            max={90}
            value={holdDays}
            onChange={(event) => setHoldDays(event.target.value)}
            placeholder="Ixtiyoriy"
            className={PANEL_INPUT}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={book.isPending || !clientName.trim() || !clientPhone.trim()}
        className="mt-3 w-full rounded-[12px] bg-brand-amber px-4 py-2.5 text-[14px] font-extrabold text-white disabled:opacity-60"
      >
        {book.isPending ? 'Band qilinmoqda...' : 'Band qilish'}
      </button>

      {book.isError && (
        <p className="mt-2 text-[13px] font-semibold text-brand-rose">
          Band qilishda xatolik. Qayta urinib ko'ring.
        </p>
      )}
    </form>
  );
}

/** The active-hold summary + cancel/convert actions shown for a BOOKED unit. */
function BookedActions({ buildingId, unit }: { buildingId: string; unit: Unit }) {
  const action = useBookingAction(buildingId);
  const [cancelReason, setCancelReason] = useState('');
  const booking = unit.activeBooking;

  if (!booking) {
    return <p className="text-[13px] font-semibold text-ink-3">Faol band topilmadi.</p>;
  }
  const bookingId = booking.id;

  function handleCancel() {
    action.mutate({
      bookingId,
      action: 'cancel',
      cancelReason: cancelReason.trim() ? cancelReason.trim() : undefined,
    });
  }

  function handleConvert() {
    action.mutate({ bookingId, action: 'convert' });
  }

  return (
    <div>
      <h3 className="text-[14px] font-bold text-ink">Band</h3>
      <dl className="mt-2 space-y-1 text-[13px] text-ink-2">
        <div className="flex justify-between gap-2">
          <dt className="text-ink-3">Mijoz</dt>
          <dd className="font-semibold text-ink">{booking.clientName}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-ink-3">Telefon</dt>
          <dd className="font-semibold text-ink">{booking.clientPhone}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-ink-3">Muddat</dt>
          <dd className="font-semibold text-ink">
            {new Date(booking.holdUntil).toLocaleDateString('uz-UZ')}
          </dd>
        </div>
      </dl>

      <label className="mt-3 block">
        <span className={LABEL}>Bekor qilish sababi</span>
        <input
          value={cancelReason}
          onChange={(event) => setCancelReason(event.target.value)}
          maxLength={500}
          placeholder="Ixtiyoriy"
          className={PANEL_INPUT}
        />
      </label>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleCancel}
          disabled={action.isPending}
          className="flex-1 rounded-[12px] border border-brand-rose px-4 py-2.5 text-[14px] font-bold text-brand-rose disabled:opacity-60"
        >
          {action.isPending ? '...' : 'Bekor qilish'}
        </button>
        <button
          type="button"
          onClick={handleConvert}
          disabled={action.isPending}
          className="flex-1 rounded-[12px] bg-brand-green px-4 py-2.5 text-[14px] font-extrabold text-white disabled:opacity-60"
        >
          {action.isPending ? '...' : 'Sotildi'}
        </button>
      </div>

      {action.isError && (
        <p className="mt-2 text-[13px] font-semibold text-brand-rose">
          Amalni bajarishda xatolik. Qayta urinib ko'ring.
        </p>
      )}
    </div>
  );
}

/** The scrollable units table, or an empty-state line when there are none. */
function UnitsTable({ buildingId, units }: { buildingId: string; units: Unit[] }) {
  if (units.length === 0) {
    return <p className="mt-4 text-[14px] text-ink-3">Hozircha xonadon yo'q</p>;
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-line">
            <th className={HEAD}>№</th>
            <th className={HEAD}>Qavat</th>
            <th className={HEAD}>Xonalar</th>
            <th className={HEAD}>Maydon, m²</th>
            <th className={HEAD}>Narx</th>
            <th className={HEAD}>Holat</th>
            <th className={HEAD} aria-label="Amallar" />
          </tr>
        </thead>
        <tbody>
          {units.map((unit) => (
            <UnitRow key={unit.id} buildingId={buildingId} unit={unit} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * One unit row. The status <select> is always live (a change PATCHes immediately);
 * the numeric fields flip into inline inputs behind the "Tahrirlash" affordance.
 */
function UnitRow({ buildingId, unit }: { buildingId: string; unit: Unit }) {
  const update = useUpdateUnit(buildingId);
  const remove = useDeleteUnit(buildingId);
  const [editing, setEditing] = useState(false);

  const [number, setNumber] = useState(unit.number);
  const [floor, setFloor] = useState(String(unit.floor));
  const [rooms, setRooms] = useState(unit.rooms != null ? String(unit.rooms) : '');
  const [areaM2, setAreaM2] = useState(unit.areaM2 != null ? String(unit.areaM2) : '');
  const [priceSom, setPriceSom] = useState(unit.priceSom ?? '');

  function resetFromUnit() {
    setNumber(unit.number);
    setFloor(String(unit.floor));
    setRooms(unit.rooms != null ? String(unit.rooms) : '');
    setAreaM2(unit.areaM2 != null ? String(unit.areaM2) : '');
    setPriceSom(unit.priceSom ?? '');
  }

  function handleStatusChange(status: UnitStatus) {
    update.mutate({ unitId: unit.id, status });
  }

  async function handleSave() {
    const trimmedNumber = number.trim();
    if (!trimmedNumber) return;
    await update.mutateAsync({
      unitId: unit.id,
      number: trimmedNumber,
      floor: Number(floor) || 0,
      // Optional numerics: a cleared field is omitted rather than sent as 0/NaN.
      rooms: rooms.trim() ? Number(rooms) : undefined,
      areaM2: areaM2.trim() ? Number(areaM2) : undefined,
      priceSom: priceSom.trim() ? priceSom.trim() : undefined,
    });
    setEditing(false);
  }

  function handleCancel() {
    resetFromUnit();
    setEditing(false);
  }

  if (editing) {
    return (
      <tr className="border-b border-line align-top">
        <td className={CELL}>
          <input
            aria-label="Raqam"
            value={number}
            onChange={(event) => setNumber(event.target.value)}
            maxLength={40}
            className={TABLE_INPUT}
          />
        </td>
        <td className={CELL}>
          <input
            aria-label="Qavat"
            type="number"
            min={0}
            max={200}
            value={floor}
            onChange={(event) => setFloor(event.target.value)}
            className={TABLE_INPUT}
          />
        </td>
        <td className={CELL}>
          <input
            aria-label="Xonalar"
            type="number"
            min={0}
            max={50}
            value={rooms}
            onChange={(event) => setRooms(event.target.value)}
            className={TABLE_INPUT}
          />
        </td>
        <td className={CELL}>
          <input
            aria-label="Maydon"
            type="number"
            min={0}
            step="0.1"
            value={areaM2}
            onChange={(event) => setAreaM2(event.target.value)}
            className={TABLE_INPUT}
          />
        </td>
        <td className={CELL}>
          <input
            aria-label="Narx"
            inputMode="numeric"
            value={priceSom}
            onChange={(event) => setPriceSom(event.target.value.replace(/\D/g, ''))}
            placeholder="so'm"
            className={TABLE_INPUT}
          />
        </td>
        <td className={CELL}>
          <StatusSelect
            value={unit.status}
            disabled={update.isPending}
            onChange={handleStatusChange}
          />
        </td>
        <td className={CELL}>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={handleSave}
              disabled={update.isPending || number.trim().length === 0}
              className="rounded-[10px] bg-accent px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-60"
            >
              Saqlash
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={update.isPending}
              className="rounded-[10px] border border-line px-3 py-1.5 text-[12px] font-semibold text-ink-2"
            >
              Bekor
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-line">
      <td className={cn(CELL, 'font-semibold')}>{unit.number}</td>
      <td className={CELL}>{unit.floor}</td>
      <td className={CELL}>{unit.rooms != null ? unit.rooms : '—'}</td>
      <td className={CELL}>{unit.areaM2 != null ? unit.areaM2 : '—'}</td>
      <td className={CELL}>{unit.priceSom ? formatPriceSom(unit.priceSom, 'SALE') : '—'}</td>
      <td className={CELL}>
        <StatusSelect
          value={unit.status}
          disabled={update.isPending}
          onChange={handleStatusChange}
        />
      </td>
      <td className={CELL}>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-[10px] border border-line px-3 py-1.5 text-[12px] font-semibold text-ink-2"
          >
            Tahrirlash
          </button>
          <button
            type="button"
            onClick={() => remove.mutate(unit.id)}
            disabled={remove.isPending}
            className="rounded-[10px] border border-brand-rose px-3 py-1.5 text-[12px] font-semibold text-brand-rose disabled:opacity-60"
          >
            O'chirish
          </button>
        </div>
      </td>
    </tr>
  );
}

/** The inline status picker, tinted to match the chosen status. */
function StatusSelect({
  value,
  disabled,
  onChange,
}: {
  value: UnitStatus;
  disabled: boolean;
  onChange: (status: UnitStatus) => void;
}) {
  return (
    <select
      aria-label="Holat"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as UnitStatus)}
      className={cn(
        'rounded-full px-2.5 py-1 text-[12px] font-semibold outline-none disabled:opacity-60',
        UNIT_STATUS_BADGE[value],
      )}
    >
      {UNIT_STATUS_OPTIONS.map((status) => (
        <option key={status} value={status}>
          {UNIT_STATUS_LABELS[status]}
        </option>
      ))}
    </select>
  );
}

/** The stacked "add a unit" form beneath the table. */
function AddUnitForm({ buildingId }: { buildingId: string }) {
  const create = useCreateUnit(buildingId);

  const [number, setNumber] = useState('');
  const [floor, setFloor] = useState('');
  const [rooms, setRooms] = useState('');
  const [areaM2, setAreaM2] = useState('');
  const [priceSom, setPriceSom] = useState('');
  const [status, setStatus] = useState<UnitStatus>('AVAILABLE');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedNumber = number.trim();
    if (!trimmedNumber) return;
    await create.mutateAsync({
      number: trimmedNumber,
      floor: floor.trim() ? Number(floor) : 0,
      rooms: rooms.trim() ? Number(rooms) : undefined,
      areaM2: areaM2.trim() ? Number(areaM2) : undefined,
      priceSom: priceSom.trim() ? priceSom.trim() : undefined,
      status,
    });
    setNumber('');
    setFloor('');
    setRooms('');
    setAreaM2('');
    setPriceSom('');
    setStatus('AVAILABLE');
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-card bg-card p-5 shadow-card">
      <h2 className="text-[15px] font-bold text-ink">Yangi xonadon</h2>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL} htmlFor="unit-number">
            Raqam
          </label>
          <input
            id="unit-number"
            type="text"
            value={number}
            onChange={(event) => setNumber(event.target.value)}
            maxLength={40}
            placeholder="Masalan: 42"
            className={FIELD}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="unit-floor">
            Qavat
          </label>
          <input
            id="unit-floor"
            type="number"
            min={0}
            max={200}
            value={floor}
            onChange={(event) => setFloor(event.target.value)}
            placeholder="0"
            className={FIELD}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="unit-rooms">
            Xonalar
          </label>
          <input
            id="unit-rooms"
            type="number"
            min={0}
            max={50}
            value={rooms}
            onChange={(event) => setRooms(event.target.value)}
            placeholder="Ixtiyoriy"
            className={FIELD}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="unit-area">
            Maydon, m²
          </label>
          <input
            id="unit-area"
            type="number"
            min={0}
            step="0.1"
            value={areaM2}
            onChange={(event) => setAreaM2(event.target.value)}
            placeholder="Ixtiyoriy"
            className={FIELD}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="unit-price">
            Narx, so'm
          </label>
          <input
            id="unit-price"
            inputMode="numeric"
            value={priceSom}
            onChange={(event) => setPriceSom(event.target.value.replace(/\D/g, ''))}
            placeholder="Ixtiyoriy"
            className={FIELD}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="unit-status">
            Holat
          </label>
          <select
            id="unit-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as UnitStatus)}
            className={FIELD}
          >
            {UNIT_STATUS_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {UNIT_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={create.isPending || number.trim().length === 0}
        className="mt-4 w-full rounded-[14px] border border-accent bg-accent-soft px-6 py-3 text-[15px] font-extrabold text-accent disabled:opacity-60"
      >
        {create.isPending ? 'Qo‘shilmoqda...' : 'Xonadon qo‘shish'}
      </button>

      {create.isError && (
        <p className="mt-3 text-center text-[13px] font-semibold text-brand-rose">
          Xonadon qo'shishda xatolik. Qayta urinib ko'ring.
        </p>
      )}
    </form>
  );
}

/** Rename / re-floor the building, or delete it (which returns to the complex). */
function BuildingSettings({
  buildingId,
  complexId,
  backTo,
}: {
  buildingId: string;
  complexId: string;
  backTo: string;
}) {
  const navigate = useNavigate();
  const update = useUpdateBuilding(complexId);
  const remove = useDeleteBuilding(complexId);

  const [name, setName] = useState('');
  const [floors, setFloors] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    const floorsValue = floors.trim() ? Number(floors) : undefined;
    // Nothing typed → nothing to send (the building has no fields of its own here
    // to seed from, so both inputs are optional edits).
    if (!trimmed && floorsValue === undefined) return;
    await update.mutateAsync({
      buildingId,
      name: trimmed || undefined,
      floors: floorsValue,
    });
    setName('');
    setFloors('');
  }

  async function handleDelete() {
    await remove.mutateAsync(buildingId);
    navigate(backTo);
  }

  return (
    <section className="rounded-card bg-card p-5 shadow-card">
      <h2 className="text-[15px] font-bold text-ink">Bino sozlamalari</h2>

      <form onSubmit={handleUpdate} className="mt-3">
        <label className={LABEL} htmlFor="building-name">
          Yangi nomi
        </label>
        <input
          id="building-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={120}
          placeholder="Masalan: A blok"
          className={FIELD}
        />

        <label className={cn(LABEL, 'mt-4')} htmlFor="building-floors">
          Qavatlar soni
        </label>
        <input
          id="building-floors"
          type="number"
          min={1}
          max={200}
          value={floors}
          onChange={(event) => setFloors(event.target.value)}
          placeholder="Ixtiyoriy"
          className={FIELD}
        />

        <button
          type="submit"
          disabled={update.isPending || (name.trim().length === 0 && floors.trim().length === 0)}
          className="mt-4 w-full rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark px-6 py-3 text-[15px] font-extrabold text-white shadow-lg shadow-accent/35 disabled:opacity-60"
        >
          {update.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>

        {update.isError && (
          <p className="mt-3 text-center text-[13px] font-semibold text-brand-rose">
            Saqlashda xatolik. Qayta urinib ko'ring.
          </p>
        )}
      </form>

      <div className="mt-5 border-t border-line pt-4">
        <p className="text-[13px] text-ink-2">
          Bino va uning barcha xonadonlari o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi.
        </p>

        {confirmingDelete ? (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={remove.isPending}
              className="flex-1 rounded-[14px] bg-brand-rose px-4 py-3 text-[14px] font-extrabold text-white disabled:opacity-60"
            >
              {remove.isPending ? 'O‘chirilmoqda...' : 'Ha, o‘chirish'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              disabled={remove.isPending}
              className="flex-1 rounded-[14px] border border-line px-4 py-3 text-[14px] font-semibold text-ink-2"
            >
              Bekor qilish
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="mt-3 w-full rounded-[14px] border border-brand-rose px-6 py-3 text-[15px] font-extrabold text-brand-rose"
          >
            Binoni o'chirish
          </button>
        )}

        {remove.isError && (
          <p className="mt-3 text-center text-[13px] font-semibold text-brand-rose">
            O'chirishda xatolik. Qayta urinib ko'ring.
          </p>
        )}
      </div>
    </section>
  );
}
