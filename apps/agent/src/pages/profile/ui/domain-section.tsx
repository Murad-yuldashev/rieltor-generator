import { useState } from 'react';
import { RealtorHostnameSchema, type RealtorProfile } from '@rieltor/shared';
import { ApiError } from '@/shared/api/client';
import { useClearDomain, useSetDomain, useVerifyDomain } from '@/features/profile';

/** Custom-domain block inside the profile's "Ommaviy sahifangiz" area. Set a domain,
 *  publish the two DNS records, verify ownership, or remove it. Feeds/embeds and the
 *  microsite reuse the domain once verified. */
export function DomainSection({ profile }: { profile: RealtorProfile }) {
  const setDomain = useSetDomain();
  const verifyDomain = useVerifyDomain();
  const clearDomain = useClearDomain();
  const [domainInput, setDomainInput] = useState(profile.customDomain ?? '');
  const [formError, setFormError] = useState<string | null>(null);

  const hasSlug = Boolean(profile.slug);
  const saved = profile.customDomain;
  const verified = profile.customDomainVerified;
  const token = profile.customDomainToken;

  const handleSave = () => {
    const parsed = RealtorHostnameSchema.safeParse(domainInput);
    if (!parsed.success) {
      setFormError('Domen manzili noto‘g‘ri (masalan: mysite.uz)');
      return;
    }
    setFormError(null);
    setDomain.mutate(parsed.data);
  };

  const serverError = (e: unknown) =>
    e instanceof ApiError ? e.message : "Xatolik yuz berdi. Qaytadan urinib ko'ring.";

  return (
    <section className="rounded-card bg-card p-4 shadow-card md:col-span-2">
      <p className="text-[13px] font-bold text-ink">Shaxsiy domen</p>
      <p className="mt-1 text-[12px] text-ink-3">
        Saytingizni o‘z domeningizda oching (masalan, sizning-domeningiz.uz). DNS sozlangach
        tasdiqlang.
      </p>

      {!hasSlug ? (
        // setDomain requires a slug (Task 2) — a verified domain must be servable.
        <p className="mt-3 rounded-[12px] bg-brand-amber/10 px-3 py-2 text-[12.5px] font-semibold text-brand-amber">
          Avval yuqorida sahifa manzili (slug) belgilang — shundan so‘ng domen ulash mumkin.
        </p>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value.trim().toLowerCase())}
              placeholder="sizning-domeningiz.uz"
              className="min-w-[220px] flex-1 rounded-[12px] border border-line bg-surface px-3.5 py-2.5 text-[14px] outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={setDomain.isPending}
              className="rounded-[12px] bg-accent px-4 py-2.5 text-[13px] font-extrabold text-white disabled:opacity-50"
            >
              {setDomain.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
          {formError && (
            <p className="mt-2 text-[12.5px] font-semibold text-brand-rose">{formError}</p>
          )}
          {setDomain.isError && !formError && (
            <p className="mt-2 text-[12.5px] font-semibold text-brand-rose">
              {serverError(setDomain.error)}
            </p>
          )}
        </>
      )}

      {saved && (
        <div className="mt-4 rounded-[12px] border border-line/60 bg-surface p-3.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] font-bold text-ink">{saved}</span>
            <span
              className={
                verified
                  ? 'rounded-full bg-accent/10 px-2.5 py-1 text-[11.5px] font-extrabold text-accent'
                  : 'rounded-full bg-brand-amber/10 px-2.5 py-1 text-[11.5px] font-extrabold text-brand-amber'
              }
            >
              {verified ? 'Tasdiqlangan' : 'Tasdiqlanmagan'}
            </span>
          </div>

          {!verified && token && (
            <div className="mt-3 space-y-2 text-[12px] text-ink-2">
              <p className="font-semibold text-ink">Quyidagi DNS yozuvlarini qo‘shing:</p>
              <pre className="overflow-x-auto rounded-[10px] bg-card p-2.5 text-[11.5px] leading-relaxed">
                {`ALIAS/ANAME  ${saved}                →  <platforma manzili>
TXT          _rieltor-verify.${saved}  →  ${token}`}
              </pre>
              <p className="text-ink-3">
                Apeks domenda (masalan, {saved}) ALIAS/ANAME (yoki A) yozuvidan foydalaning —
                apeksda CNAME ishlamaydi. DNS tarqalgach “Tekshirish”ni bosing. TLS (https)
                platforma tomonidan avtomatik beriladi.
              </p>
            </div>
          )}

          <div className="mt-3 flex gap-2">
            {!verified && (
              <button
                type="button"
                onClick={() => verifyDomain.mutate()}
                disabled={verifyDomain.isPending}
                className="rounded-[12px] bg-accent px-4 py-2.5 text-[13px] font-extrabold text-white disabled:opacity-50"
              >
                {verifyDomain.isPending ? 'Tekshirilmoqda...' : 'Tekshirish'}
              </button>
            )}
            <button
              type="button"
              onClick={() => clearDomain.mutate()}
              disabled={clearDomain.isPending}
              className="rounded-[12px] border border-line px-4 py-2.5 text-[13px] font-bold text-ink-2 disabled:opacity-50"
            >
              O‘chirish
            </button>
          </div>
          {verifyDomain.isSuccess && !verified && (
            <p className="mt-2 text-[12.5px] font-semibold text-brand-amber">
              DNS yozuvi hali topilmadi — biroz kutib, qaytadan tekshiring.
            </p>
          )}
          {verified && (
            <p className="mt-2 text-[12.5px] font-semibold text-accent">
              Saytingiz {saved} manzilida ochiladi.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
