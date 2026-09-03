import { useState, type FormEvent } from 'react';
import { TASHKENT_DISTRICTS } from '@rieltor/shared';
import { useBecomeDeveloper } from '@/features/developer';

const PERKS = [
  'Turar-joy majmualaringizni bitta joyda boshqaring',
  'Binolar va xonadonlarni qo‘shing hamda kuzatib boring',
  'Xaridorlarga to‘g‘ridan-to‘g‘ri e’lon qiling',
];

/**
 * Shown by the developer gate to a non-DEVELOPER. The form creates the
 * organization and upgrades the account to DEVELOPER in one call; on success the
 * mutation invalidates the session cache, so the gate re-reads role=DEVELOPER and
 * resolves straight to the cabinet — no navigation needed.
 */
export function BecomeDeveloperPage() {
  const [name, setName] = useState('');
  const [district, setDistrict] = useState('');
  const { mutateAsync, isPending, isError } = useBecomeDeveloper();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    // `district` is optional — an empty select stays out of the body entirely.
    await mutateAsync({ name: trimmed, district: district || undefined });
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-content flex-col justify-center gap-6 bg-surface px-5 py-12">
      <form onSubmit={handleSubmit} className="rounded-card bg-card p-6 shadow-card">
        <span className="inline-flex rounded-full bg-accent-soft px-3 py-1 text-[12px] font-bold text-accent">
          Quruvchilar uchun
        </span>
        <h1 className="mt-4 text-[22px] font-extrabold tracking-tight text-ink">
          Quruvchi kabinetini oching
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-2">
          Tashkilotingizni yarating va turar-joy majmualaringizni platformada boshqarishni boshlang.
        </p>

        <ul className="mt-5 flex flex-col gap-3">
          {PERKS.map((perk) => (
            <li key={perk} className="flex items-start gap-2 text-[14px] text-ink">
              <span className="mt-0.5 text-accent" aria-hidden="true">
                ✓
              </span>
              <span>{perk}</span>
            </li>
          ))}
        </ul>

        <label className="mt-6 block text-[13px] font-semibold text-ink-2" htmlFor="org-name">
          Tashkilot nomi
        </label>
        <input
          id="org-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={120}
          placeholder="Masalan: Golden House"
          className="mt-1.5 w-full rounded-[14px] border border-line bg-surface px-4 py-3 text-[15px] text-ink outline-none focus:border-accent"
        />

        <label className="mt-4 block text-[13px] font-semibold text-ink-2" htmlFor="org-district">
          Tuman
        </label>
        <select
          id="org-district"
          value={district}
          onChange={(event) => setDistrict(event.target.value)}
          className="mt-1.5 w-full rounded-[14px] border border-line bg-surface px-4 py-3 text-[15px] text-ink outline-none focus:border-accent"
        >
          <option value="">Tuman tanlang</option>
          {TASHKENT_DISTRICTS.map((tuman) => (
            <option key={tuman} value={tuman}>
              {tuman}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={isPending || name.trim().length === 0}
          className="mt-6 w-full rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark px-6 py-3.5 text-[15px] font-extrabold text-white shadow-lg shadow-accent/35 disabled:opacity-60"
        >
          {isPending ? 'Ochilmoqda...' : 'Kabinetni ochish'}
        </button>

        {isError && (
          <p className="mt-3 text-center text-[13px] font-semibold text-brand-rose">
            Xatolik yuz berdi. Qayta urinib ko‘ring.
          </p>
        )}
      </form>
    </main>
  );
}
