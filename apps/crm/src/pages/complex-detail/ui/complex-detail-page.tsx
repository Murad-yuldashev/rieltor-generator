import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { imageVariantSrc, type ComplexDetail, type ComplexStatus } from '@rieltor/shared';
import {
  COMPLEX_STATUS_LABELS,
  COMPLEX_STATUS_OPTIONS,
  PUBLISH_STATE_BADGE,
  PUBLISH_STATE_LABELS,
  useComplex,
  useComplexImages,
  useCreateBuilding,
  useDeleteComplex,
  usePublishComplex,
  useUpdateComplex,
} from '@/features/developer';
import { ApiError } from '@/shared/api/client';
import { cn } from '@/shared/lib/cn';
import { CabinetNav } from '@/widgets/cabinet-nav';

/** Per-complex gallery cap — mirrors the API's MAX_COMPLEX_IMAGES (upload 409s past it). */
const MAX_COMPLEX_IMAGES = 20;

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
  const publish = usePublishComplex(complex.id);
  const createBuilding = useCreateBuilding(complex.id);

  const [name, setName] = useState(complex.name);
  const [district, setDistrict] = useState(complex.district);
  const [address, setAddress] = useState(complex.address ?? '');
  const [description, setDescription] = useState(complex.description ?? '');
  const [status, setStatus] = useState<ComplexStatus>(complex.status);
  // Geo pin — number inputs held as strings; blank means "leave as-is" on save.
  const [latitude, setLatitude] = useState(
    complex.latitude != null ? String(complex.latitude) : '',
  );
  const [longitude, setLongitude] = useState(
    complex.longitude != null ? String(complex.longitude) : '',
  );
  // Cross-CRM commission (5.4) — entered as a percent, stored as basis points.
  // Seeded from `commissionBps / 100`; blank means "no rate set" (leave as-is on save).
  const [commissionPercent, setCommissionPercent] = useState(
    complex.commissionBps != null ? String(complex.commissionBps / 100) : '',
  );
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const isPublished = complex.publishStatus === 'PUBLISHED';
  // A failed publish gate returns 409 with an Uzbek reason (verify org / add an
  // image / price an available unit) — show it verbatim; anything else is generic.
  const publishError =
    publish.error instanceof ApiError && publish.error.status === 409
      ? publish.error.message
      : publish.isError
        ? "E'lon holatini o'zgartirishda xatolik. Qayta urinib ko'ring."
        : null;

  const [buildingName, setBuildingName] = useState('');
  const [buildingFloors, setBuildingFloors] = useState('');

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedDistrict = district.trim();
    if (!trimmedName || !trimmedDistrict) return;
    // `address`/`description`/`latitude`/`longitude` are optional on the DTO — a
    // blank field is omitted (the server keeps the current value) rather than sent
    // as a blank string. A non-numeric geo value parses to NaN and is dropped too.
    const latValue = latitude.trim() ? Number(latitude) : undefined;
    const lngValue = longitude.trim() ? Number(longitude) : undefined;
    // Commission is a percent in the UI, stored as basis points: bps = round(pct * 100).
    // Blank / out-of-range → omitted (the server keeps the current rate).
    const pctValue = commissionPercent.trim() ? Number(commissionPercent) : undefined;
    const commissionBps =
      pctValue != null && Number.isFinite(pctValue) && pctValue >= 0 && pctValue <= 100
        ? Math.round(pctValue * 100)
        : undefined;
    await update.mutateAsync({
      name: trimmedName,
      district: trimmedDistrict,
      status,
      address: address.trim() || undefined,
      description: description.trim() || undefined,
      latitude: Number.isFinite(latValue) ? latValue : undefined,
      longitude: Number.isFinite(lngValue) ? lngValue : undefined,
      commissionBps,
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

        <label className={LABEL} htmlFor="edit-latitude">
          Kenglik (latitude)
        </label>
        <input
          id="edit-latitude"
          type="number"
          step="any"
          min={-90}
          max={90}
          value={latitude}
          onChange={(event) => setLatitude(event.target.value)}
          placeholder="Ixtiyoriy, masalan: 41.311"
          className={FIELD}
        />

        <label className={LABEL} htmlFor="edit-longitude">
          Uzunlik (longitude)
        </label>
        <input
          id="edit-longitude"
          type="number"
          step="any"
          min={-180}
          max={180}
          value={longitude}
          onChange={(event) => setLongitude(event.target.value)}
          placeholder="Ixtiyoriy, masalan: 69.279"
          className={FIELD}
        />

        <label className={LABEL} htmlFor="edit-commission">
          Komissiya, %
        </label>
        <input
          id="edit-commission"
          type="number"
          step="0.01"
          min={0}
          max={100}
          value={commissionPercent}
          onChange={(event) => setCommissionPercent(event.target.value)}
          placeholder="Ixtiyoriy, masalan: 1.5"
          className={FIELD}
        />
        <p className="mt-1.5 text-[12px] text-ink-3">
          Sotuvchilar uchun standart komissiya. Har bir xonadonda alohida belgilash mumkin.
        </p>

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

      <ComplexMedia complex={complex} />

      <section className="rounded-card bg-card p-5 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-bold text-ink">Marketpleysda e'lon</h2>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-bold ${PUBLISH_STATE_BADGE[complex.publishStatus]}`}
          >
            {PUBLISH_STATE_LABELS[complex.publishStatus]}
          </span>
        </div>
        <p className="mt-1 text-[13px] text-ink-2">
          {isPublished
            ? "Majmua marketpleysda ko'rinmoqda. E'londan olsangiz, xaridorlar uni ko'ra olmaydi."
            : "E'lon qilish uchun tashkilot tasdiqdan o'tgan, kamida bitta rasm va narxli bo'sh xonadon bo'lishi kerak."}
        </p>

        <button
          type="button"
          onClick={() => publish.mutate(!isPublished)}
          disabled={publish.isPending}
          className={
            isPublished
              ? 'mt-4 w-full rounded-[14px] border border-line px-6 py-3 text-[15px] font-extrabold text-ink-2 disabled:opacity-60'
              : 'mt-4 w-full rounded-[14px] bg-brand-green px-6 py-3.5 text-[15px] font-extrabold text-white disabled:opacity-60'
          }
        >
          {publish.isPending ? 'Bajarilmoqda...' : isPublished ? "E'londan olish" : "E'lon qilish"}
        </button>

        {publishError && (
          <p className="mt-3 text-[13px] font-semibold text-brand-rose">{publishError}</p>
        )}
      </section>

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

/**
 * Cover + gallery media manager. Selecting a file uploads it immediately, then the
 * input is cleared so re-picking the same file still fires `change`. The gallery is
 * re-rendered straight from the `ComplexDetail` each mutation returns; the first
 * image (position 0) is the cover. The upload cap (20) answers with a 409 whose
 * Uzbek reason is shown verbatim.
 *
 * NOTE: the delete endpoint is keyed by the image's `position` here — the shared
 * `Image` DTO exposes no row id, and position is its only stable per-complex
 * identifier (it equals the `<nn>` segment of `base`).
 */
function ComplexMedia({ complex }: { complex: ComplexDetail }) {
  const { uploadImage, deleteImage } = useComplexImages(complex.id);

  const atCap = complex.imageCount >= MAX_COMPLEX_IMAGES;

  function handleSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Clear the input right away so picking the same file again still fires `change`.
    event.target.value = '';
    if (file) uploadImage.mutate(file);
  }

  // A full gallery returns 409 with the Uzbek reason ("Rasmlar chegarasi to'ldi") —
  // show it verbatim; any other failure is generic.
  const uploadError =
    uploadImage.error instanceof ApiError && uploadImage.error.status === 409
      ? uploadImage.error.message
      : uploadImage.isError
        ? "Rasm yuklashda xatolik. Qayta urinib ko'ring."
        : null;

  return (
    <section className="rounded-card bg-card p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold text-ink">Rasmlar</h2>
        <span className="shrink-0 text-[13px] font-semibold text-ink-3">
          {complex.imageCount} / {MAX_COMPLEX_IMAGES}
        </span>
      </div>
      <p className="mt-1 text-[13px] text-ink-2">
        E'lon qilish uchun kamida bitta rasm kerak. Birinchi rasm muqova bo'ladi.
      </p>

      {complex.gallery.length === 0 ? (
        <p className="mt-3 text-[14px] text-ink-3">Hozircha rasm yo'q</p>
      ) : (
        <ul className="mt-4 grid grid-cols-3 gap-3">
          {complex.gallery.map((image, index) => (
            <li
              key={image.base}
              className="relative overflow-hidden rounded-[14px] border border-line"
            >
              <img
                src={imageVariantSrc(image.base, 360)}
                alt={`Majmua rasmi ${index + 1}`}
                width={image.width}
                height={image.height}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
              {index === 0 && (
                <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-bold text-white">
                  Muqova
                </span>
              )}
              <button
                type="button"
                onClick={() => deleteImage.mutate(String(image.position))}
                disabled={deleteImage.isPending}
                className="absolute right-2 top-2 rounded-full bg-brand-rose px-2 py-0.5 text-[11px] font-bold text-white disabled:opacity-60"
              >
                O'chirish
              </button>
            </li>
          ))}
        </ul>
      )}

      <label
        className={cn(
          'mt-4 flex w-full cursor-pointer items-center justify-center rounded-[14px] border border-accent bg-accent-soft px-6 py-3 text-[15px] font-extrabold text-accent',
          (uploadImage.isPending || atCap) && 'pointer-events-none opacity-60',
        )}
      >
        {uploadImage.isPending
          ? 'Yuklanmoqda...'
          : atCap
            ? "Rasmlar chegarasi to'ldi"
            : "Rasm qo'shish"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleSelect}
          disabled={uploadImage.isPending || atCap}
          className="hidden"
        />
      </label>

      {uploadError && (
        <p className="mt-3 text-[13px] font-semibold text-brand-rose">{uploadError}</p>
      )}
      {deleteImage.isError && (
        <p className="mt-3 text-[13px] font-semibold text-brand-rose">
          Rasmni o'chirishda xatolik. Qayta urinib ko'ring.
        </p>
      )}
    </section>
  );
}
