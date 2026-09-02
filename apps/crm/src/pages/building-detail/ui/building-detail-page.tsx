import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { formatPriceSom, type Unit, type UnitStatus } from '@rieltor/shared';
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

  return (
    <main className={SHELL}>
      <CabinetNav />
      <Link to={backTo} className="text-[13px] font-semibold text-accent">
        &lsaquo; Majmuaga qaytish
      </Link>

      <section className="rounded-card bg-card p-5 shadow-card">
        <h1 className="text-[18px] font-extrabold tracking-tight text-ink">Xonadonlar</h1>
        <StatusLegend />

        {isPending ? (
          <p className="mt-4 text-[15px] font-semibold text-ink-2">Yuklanmoqda...</p>
        ) : isError || !units ? (
          <p className="mt-4 text-[14px] font-semibold text-brand-rose">
            Xonadonlarni yuklab bo'lmadi. Qayta urinib ko'ring.
          </p>
        ) : (
          <UnitsTable buildingId={id} units={units} />
        )}
      </section>

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
