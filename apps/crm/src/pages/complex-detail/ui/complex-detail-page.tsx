import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import type { ComplexDetail, ComplexStatus } from '@rieltor/shared';
import {
  COMPLEX_STATUS_LABELS,
  COMPLEX_STATUS_OPTIONS,
  useComplex,
  useCreateBuilding,
  useDeleteComplex,
  useUpdateComplex,
} from '@/features/developer';
import { CabinetNav } from '@/widgets/cabinet-nav';

const SHELL = 'mx-auto flex min-h-dvh max-w-content flex-col gap-5 bg-surface px-5 py-8';
const FIELD =
  'mt-1.5 w-full rounded-[14px] border border-line bg-surface px-4 py-3 text-[15px] text-ink outline-none focus:border-accent';
const LABEL = 'mt-4 block text-[13px] font-semibold text-ink-2';

/**
 * Complex detail (`/complexes/:id`). The outer component resolves the fetch and
 * hands the loaded complex to the editor as a prop, so the edit form's initial
 * state seeds cleanly from props (keyed by id, it remounts when the id changes).
 */
export function ComplexDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { data: complex, isPending, isError } = useComplex(id);

  return (
    <main className={SHELL}>
      <CabinetNav />
      <Link to="/complexes" className="text-[13px] font-semibold text-accent">
        &lsaquo; Majmualar
      </Link>

      {isPending ? (
        <p className="text-[15px] font-semibold text-ink-2">Yuklanmoqda...</p>
      ) : isError || !complex ? (
        <p className="text-[14px] font-semibold text-brand-rose">
          Majmuani yuklab bo'lmadi. Qayta urinib ko'ring.
        </p>
      ) : (
        <ComplexDetailView key={complex.id} complex={complex} />
      )}
    </main>
  );
}

/** The edit form, delete control, and buildings section for a loaded complex. */
function ComplexDetailView({ complex }: { complex: ComplexDetail }) {
  const navigate = useNavigate();
  const update = useUpdateComplex(complex.id);
  const remove = useDeleteComplex();
  const createBuilding = useCreateBuilding(complex.id);

  const [name, setName] = useState(complex.name);
  const [district, setDistrict] = useState(complex.district);
  const [address, setAddress] = useState(complex.address ?? '');
  const [description, setDescription] = useState(complex.description ?? '');
  const [status, setStatus] = useState<ComplexStatus>(complex.status);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [buildingName, setBuildingName] = useState('');
  const [buildingFloors, setBuildingFloors] = useState('');

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedDistrict = district.trim();
    if (!trimmedName || !trimmedDistrict) return;
    // `address`/`description` are optional on the DTO — an empty field is omitted
    // (the server keeps the current value) rather than sent as a blank string.
    await update.mutateAsync({
      name: trimmedName,
      district: trimmedDistrict,
      status,
      address: address.trim() || undefined,
      description: description.trim() || undefined,
    });
  }

  async function handleDelete() {
    await remove.mutateAsync(complex.id);
    navigate('/complexes');
  }

  async function handleCreateBuilding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = buildingName.trim();
    if (!trimmed) return;
    const floorsValue = buildingFloors.trim() ? Number(buildingFloors) : undefined;
    await createBuilding.mutateAsync({
      name: trimmed,
      floors: Number.isFinite(floorsValue) ? floorsValue : undefined,
    });
    setBuildingName('');
    setBuildingFloors('');
  }

  return (
    <>
      <form onSubmit={handleUpdate} className="rounded-card bg-card p-5 shadow-card">
        <h1 className="text-[18px] font-extrabold tracking-tight text-ink">Majmua ma'lumotlari</h1>

        <label className={LABEL} htmlFor="edit-name">
          Nomi
        </label>
        <input
          id="edit-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={160}
          className={FIELD}
        />

        <label className={LABEL} htmlFor="edit-district">
          Tuman
        </label>
        <input
          id="edit-district"
          type="text"
          value={district}
          onChange={(event) => setDistrict(event.target.value)}
          required
          className={FIELD}
        />

        <label className={LABEL} htmlFor="edit-address">
          Manzil
        </label>
        <input
          id="edit-address"
          type="text"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          maxLength={300}
          placeholder="Ixtiyoriy"
          className={FIELD}
        />

        <label className={LABEL} htmlFor="edit-description">
          Tavsif
        </label>
        <textarea
          id="edit-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="Ixtiyoriy"
          className={FIELD}
        />

        <label className={LABEL} htmlFor="edit-status">
          Holati
        </label>
        <select
          id="edit-status"
          value={status}
          onChange={(event) => setStatus(event.target.value as ComplexStatus)}
          className={FIELD}
        >
          {COMPLEX_STATUS_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {COMPLEX_STATUS_LABELS[value]}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={update.isPending || name.trim().length === 0 || district.trim().length === 0}
          className="mt-6 w-full rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark px-6 py-3.5 text-[15px] font-extrabold text-white shadow-lg shadow-accent/35 disabled:opacity-60"
        >
          {update.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>

        {update.isError && (
          <p className="mt-3 text-center text-[13px] font-semibold text-brand-rose">
            Saqlashda xatolik. Qayta urinib ko'ring.
          </p>
        )}
      </form>

      <section className="rounded-card bg-card p-5 shadow-card">
        <h2 className="text-[15px] font-bold text-ink">Binolar</h2>

        {complex.buildings.length === 0 ? (
          <p className="mt-3 text-[14px] text-ink-3">Hozircha bino yo'q</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {complex.buildings.map((building) => (
              <li key={building.id}>
                <Link
                  to={`/buildings/${building.id}?complex=${complex.id}`}
                  className="flex items-center justify-between gap-3 rounded-[14px] border border-line px-4 py-3"
                >
                  <span className="truncate text-[14px] font-semibold text-ink">
                    {building.name}
                  </span>
                  <span className="shrink-0 text-[13px] text-ink-3">
                    {building.floors != null ? `${building.floors} qavat` : '—'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleCreateBuilding} className="mt-4 border-t border-line pt-4">
          <label className="block text-[13px] font-semibold text-ink-2" htmlFor="building-name">
            Yangi bino nomi
          </label>
          <input
            id="building-name"
            type="text"
            value={buildingName}
            onChange={(event) => setBuildingName(event.target.value)}
            maxLength={120}
            placeholder="Masalan: A blok"
            className={FIELD}
          />

          <label className={LABEL} htmlFor="building-floors">
            Qavatlar soni
          </label>
          <input
            id="building-floors"
            type="number"
            min={1}
            max={200}
            value={buildingFloors}
            onChange={(event) => setBuildingFloors(event.target.value)}
            placeholder="Ixtiyoriy"
            className={FIELD}
          />

          <button
            type="submit"
            disabled={createBuilding.isPending || buildingName.trim().length === 0}
            className="mt-4 w-full rounded-[14px] border border-accent bg-accent-soft px-6 py-3 text-[15px] font-extrabold text-accent disabled:opacity-60"
          >
            {createBuilding.isPending ? 'Qo‘shilmoqda...' : 'Bino qo‘shish'}
          </button>

          {createBuilding.isError && (
            <p className="mt-3 text-center text-[13px] font-semibold text-brand-rose">
              Bino qo'shishda xatolik. Qayta urinib ko'ring.
            </p>
          )}
        </form>
      </section>

      <section className="rounded-card bg-card p-5 shadow-card">
        <h2 className="text-[15px] font-bold text-ink">Majmuani o'chirish</h2>
        <p className="mt-1 text-[13px] text-ink-2">
          Majmua va uning barcha binolari o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi.
        </p>

        {confirmingDelete ? (
          <div className="mt-4 flex gap-2">
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
            className="mt-4 w-full rounded-[14px] border border-brand-rose px-6 py-3 text-[15px] font-extrabold text-brand-rose"
          >
            O'chirish
          </button>
        )}

        {remove.isError && (
          <p className="mt-3 text-center text-[13px] font-semibold text-brand-rose">
            O'chirishda xatolik. Qayta urinib ko'ring.
          </p>
        )}
      </section>
    </>
  );
}
