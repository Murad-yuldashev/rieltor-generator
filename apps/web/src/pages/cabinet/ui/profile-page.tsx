import { type FormEvent, useEffect, useState } from 'react';
import { RealtorProfileUpdateSchema } from '@rieltor/shared';
import { useMe, useUpdateProfile } from '@/features/auth';
import { PageHeading } from '@/shared/ui/page-heading';
import { SectionCard } from '@/shared/ui/section-card';

interface FormState {
  name: string;
  phone: string;
  agency: string;
  registryNo: string;
}

const EMPTY: FormState = { name: '', phone: '', agency: '', registryNo: '' };

const FIELDS: { key: keyof FormState; label: string; placeholder: string }[] = [
  { key: 'name', label: 'Ism', placeholder: 'Ali Valiyev' },
  { key: 'phone', label: 'Telefon', placeholder: '+998901234567' },
  { key: 'agency', label: 'Agentlik', placeholder: "Toshkent Ko'chmas Mulk" },
  { key: 'registryNo', label: 'Reestr raqami', placeholder: '00-0000' },
];

export function ProfilePage() {
  const { realtor, isLoading } = useMe();
  const update = useUpdateProfile();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!realtor) return;
    setForm({
      name: realtor.name,
      phone: realtor.phone ?? '',
      agency: realtor.agency ?? '',
      registryNo: realtor.registryNo ?? '',
    });
  }, [realtor]);

  function submit(event: FormEvent) {
    event.preventDefault();
    setSaved(false);

    // Empty optional fields are sent as null so the server clears them; phone is
    // only sent when filled, because it cannot be cleared once set.
    const patch = {
      name: form.name,
      ...(form.phone ? { phone: form.phone } : {}),
      agency: form.agency || null,
      registryNo: form.registryNo || null,
    };

    const parsed = RealtorProfileUpdateSchema.safeParse(patch);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Ma'lumot noto'g'ri");
      return;
    }

    setError(null);
    update.mutate(parsed.data, { onSuccess: () => setSaved(true) });
  }

  if (isLoading) {
    return (
      <main className="px-4 py-6">
        <p className="text-[14px] font-semibold text-ink-3">Yuklanmoqda…</p>
      </main>
    );
  }

  return (
    <main>
      <PageHeading title="Profil" subtitle="Bu ma'lumotlar e'lon sahifasida ko'rinadi" />

      <form onSubmit={submit} className="mt-4 px-4">
        <SectionCard>
          {FIELDS.map((field) => (
            <label key={field.key} className="block py-2">
              <span className="mb-1 block text-xs font-bold text-ink-3">{field.label}</span>
              <input
                value={form[field.key]}
                placeholder={field.placeholder}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, [field.key]: event.target.value }))
                }
                className="w-full rounded-[12px] border border-line bg-card px-3 py-2.5 text-[15px] font-semibold"
              />
            </label>
          ))}
        </SectionCard>

        {error && <p className="mt-3 text-[13px] font-bold text-red-600">{error}</p>}
        {saved && !error && <p className="mt-3 text-[13px] font-bold text-emerald-600">Saqlandi</p>}

        <button
          type="submit"
          disabled={update.isPending}
          className="mt-5 w-full rounded-[14px] bg-accent py-3.5 text-[15px] font-extrabold text-white disabled:opacity-60"
        >
          Saqlash
        </button>
      </form>
    </main>
  );
}
