import { useMemo, useState, type FormEvent } from 'react';
import { TASHKENT_DISTRICTS, type ComplexStatus } from '@rieltor/shared';
import {
  COMPLEX_STATUS_LABELS,
  COMPLEX_STATUS_OPTIONS,
  useComplexes,
  useCreateComplex,
} from '@/features/developer';
import { StatTile, StatTileRow } from '@/shared/ui/stat-tile';
import { ComplexCard } from './complex-card';

const SHELL = 'flex flex-col gap-5';
const FIELD =
  'mt-1.5 w-full rounded-[14px] border border-line bg-surface px-4 py-3 text-[15px] text-ink outline-none focus:border-accent';
const LABEL = 'mt-4 block text-[13px] font-semibold text-ink-2';
// Vertical card grid: one column on phone, filling out to four across on the desktop
// tier (mirrors the web marketplace complexes grid).
const GRID =
  'flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4 lg:grid-cols-3 desk:grid-cols-4 desk:gap-5';

/**
 * Complexes list (`/complexes`). A stat-tile row and district facet chips sit above
 * a responsive cover-image card grid; each card links into its detail page. The
 * create form (name + district + status) stays a single full-width card below the
 * grid on every tier. A new complex invalidates the list, so the card appears
 * without a manual refetch. Phone stays a single column — the source order is already
 * the reading order, so no `contents` reflow trick is needed here.
 */
export function ComplexesPage() {
  const { data: complexes, isPending, isError } = useComplexes();
  const create = useCreateComplex();

  // Client-side district facet filter over the loaded list.
  const [district, setDistrict] = useState<string | null>(null);

  // Create-form fields (kept separate from the facet `district` above).
  const [name, setName] = useState('');
  const [formDistrict, setFormDistrict] = useState('');
  const [status, setStatus] = useState<ComplexStatus>('PLANNED');

  const list = complexes ?? [];

  // Facet chips keep the canonical district order/spelling but list only the
  // districts actually present in the portfolio, so no dead chip is ever offered.
  const facets = useMemo(() => {
    const present = new Set(list.map((c) => c.district));
    return TASHKENT_DISTRICTS.filter((d) => present.has(d));
  }, [list]);

  const matches = useMemo(
    () => (district === null ? list : list.filter((c) => c.district === district)),
    [list, district],
  );

  const publishedCount = list.filter((c) => c.publishStatus === 'PUBLISHED').length;
  const draftCount = list.length - publishedCount;
  const withoutImageCount = list.filter((c) => c.imageCount === 0).length;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || !formDistrict) return;
    await create.mutateAsync({ name: trimmedName, district: formDistrict, status });
    setName('');
    setFormDistrict('');
    setStatus('PLANNED');
  }

  return (
    <main className={SHELL}>
      <h1 className="text-[22px] font-extrabold tracking-tight text-ink">Turar-joy majmualari</h1>

      {isPending ? (
        <p className="text-[15px] font-semibold text-ink-2">Yuklanmoqda...</p>
      ) : isError ? (
        <p className="text-[14px] font-semibold text-brand-rose">
          Majmualarni yuklab bo'lmadi. Qayta urinib ko'ring.
        </p>
      ) : list.length > 0 ? (
        <>
          <StatTileRow className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Jami majmualar" value={list.length} />
            <StatTile label="E'lon qilingan" value={publishedCount} tone="green" />
            <StatTile label="Qoralama" value={draftCount} />
            <StatTile
              label="Rasmsiz majmualar"
              value={withoutImageCount}
              tone={withoutImageCount > 0 ? 'rose' : 'default'}
            />
          </StatTileRow>

          {facets.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setDistrict(null)}
                className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-bold transition-colors ${
                  district === null ? 'bg-accent text-white' : 'bg-surface text-ink-2'
                }`}
              >
                Barchasi
              </button>
              {facets.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDistrict(d)}
                  className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-bold transition-colors ${
                    district === d ? 'bg-accent text-white' : 'bg-surface text-ink-2'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}

          {matches.length > 0 ? (
            <div className={GRID}>
              {matches.map((complex) => (
                <ComplexCard key={complex.id} complex={complex} />
              ))}
            </div>
          ) : (
            <p className="rounded-card bg-card p-5 text-center text-[14px] text-ink-3 shadow-card">
              Bu tumanda majmua yo'q
            </p>
          )}
        </>
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
          value={formDistrict}
          onChange={(event) => setFormDistrict(event.target.value)}
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
          disabled={create.isPending || name.trim().length === 0 || !formDistrict}
          className="mt-6 w-full rounded-[14px] bg-linear-to-br from-accent to-accent-dark px-6 py-3.5 text-[15px] font-extrabold text-white shadow-lg shadow-accent/35 disabled:opacity-60"
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
