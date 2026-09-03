import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { TASHKENT_DISTRICTS, type ComplexStatus } from '@rieltor/shared';
import {
  COMPLEX_STATUS_BADGE,
  COMPLEX_STATUS_LABELS,
  COMPLEX_STATUS_OPTIONS,
  useComplexes,
  useCreateComplex,
} from '@/features/developer';
import { CabinetNav } from '@/widgets/cabinet-nav';

const SHELL = 'mx-auto flex min-h-dvh max-w-content flex-col gap-5 bg-surface px-5 py-8';
const FIELD =
  'mt-1.5 w-full rounded-[14px] border border-line bg-surface px-4 py-3 text-[15px] text-ink outline-none focus:border-accent';
const LABEL = 'mt-4 block text-[13px] font-semibold text-ink-2';

/**
 * Complexes list (`/complexes`). Renders each complex as a card that links into
 * its detail page, and a create form (name + district + status) below. A new
 * complex invalidates the list, so the card appears without a manual refetch.
 */
export function ComplexesPage() {
  const { data: complexes, isPending, isError } = useComplexes();
  const create = useCreateComplex();

  const [name, setName] = useState('');
  const [district, setDistrict] = useState('');
  const [status, setStatus] = useState<ComplexStatus>('PLANNED');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || !district) return;
    await create.mutateAsync({ name: trimmedName, district, status });
    setName('');
    setDistrict('');
    setStatus('PLANNED');
  }

  return (
    <main className={SHELL}>
      <CabinetNav />

      <h1 className="text-[22px] font-extrabold tracking-tight text-ink">Turar-joy majmualari</h1>

      {isPending ? (
        <p className="text-[15px] font-semibold text-ink-2">Yuklanmoqda...</p>
      ) : isError ? (
        <p className="text-[14px] font-semibold text-brand-rose">
          Majmualarni yuklab bo'lmadi. Qayta urinib ko'ring.
        </p>
      ) : complexes && complexes.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {complexes.map((complex) => (
            <li key={complex.id}>
              <Link
                to={`/complexes/${complex.id}`}
                className="flex items-center justify-between gap-3 rounded-card bg-card p-4 shadow-card"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-bold text-ink">
                    {complex.name}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-ink-2">{complex.district}</span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-bold ${COMPLEX_STATUS_BADGE[complex.status]}`}
                >
                  {COMPLEX_STATUS_LABELS[complex.status]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-card bg-card p-5 text-center text-[14px] text-ink-3 shadow-card">
          Hozircha ЖК yo'q
        </p>
      )}

      <form onSubmit={handleSubmit} className="rounded-card bg-card p-5 shadow-card">
        <h2 className="text-[15px] font-bold text-ink">Yangi majmua qo'shish</h2>

        <label className={LABEL} htmlFor="complex-name">
          Nomi
        </label>
        <input
          id="complex-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={160}
          placeholder="Masalan: Yangi Hayot"
          className={FIELD}
        />

        <label className={LABEL} htmlFor="complex-district">
          Tuman
        </label>
        <select
          id="complex-district"
          value={district}
          onChange={(event) => setDistrict(event.target.value)}
          required
          className={FIELD}
        >
          <option value="">Tuman tanlang</option>
          {TASHKENT_DISTRICTS.map((tuman) => (
            <option key={tuman} value={tuman}>
              {tuman}
            </option>
          ))}
        </select>

        <label className={LABEL} htmlFor="complex-status">
          Holati
        </label>
        <select
          id="complex-status"
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
          disabled={create.isPending || name.trim().length === 0 || !district}
          className="mt-6 w-full rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark px-6 py-3.5 text-[15px] font-extrabold text-white shadow-lg shadow-accent/35 disabled:opacity-60"
        >
          {create.isPending ? 'Qo‘shilmoqda...' : 'Majmua qo‘shish'}
        </button>

        {create.isError && (
          <p className="mt-3 text-center text-[13px] font-semibold text-brand-rose">
            Xatolik yuz berdi. Qayta urinib ko'ring.
          </p>
        )}
      </form>
    </main>
  );
}
