import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { DevLoginForm, TelegramLoginButton, useLogout, useMe } from '@/features/auth';
import { myListingsQuery } from '@/features/listing-form';
import { Icon } from '@/shared/ui/icon';
import { PageHeading } from '@/shared/ui/page-heading';
import { SectionCard } from '@/shared/ui/section-card';
import { MyListingRow } from './my-listing-row';

export function CabinetPage() {
  const { realtor, isLoading } = useMe();
  const logout = useLogout();
  // Called unconditionally (Rules of Hooks) but only actually fetches once signed in —
  // an anonymous visit to /cabinet would otherwise fire a doomed 401 request.
  const { data: listings = [], isLoading: listingsLoading } = useQuery({
    ...myListingsQuery(),
    enabled: Boolean(realtor),
  });

  if (isLoading) {
    return (
      <main className="px-4 py-6">
        <p className="text-[14px] font-semibold text-ink-3">Yuklanmoqda…</p>
      </main>
    );
  }

  if (!realtor) {
    return (
      <main>
        <PageHeading
          title="Rieltor kabineti"
          subtitle="O'z e'lonlaringizni joylash uchun Telegram orqali kiring — parol yoki SMS kerak emas."
        />
        <div className="mt-4 px-4">
          <TelegramLoginButton />
          {/* Renders nothing unless the dev-login build flag is on. */}
          <DevLoginForm />
        </div>
      </main>
    );
  }

  return (
    <main>
      <PageHeading title="Rieltor kabineti" subtitle="Profilingiz va e'lonlaringiz" />

      <div className="px-4">
        <SectionCard className="mt-4">
          <div className="flex items-center gap-3 py-2">
            {realtor.photoUrl ? (
              <img
                src={realtor.photoUrl}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white">
                <Icon name="homeSolid" className="h-5 w-5" strokeWidth={2.2} />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-extrabold">{realtor.name}</span>
              <span className="block text-xs font-semibold text-ink-3">@{realtor.username}</span>
            </span>
            <span className="flex items-center gap-1 text-xs font-bold text-telegram">
              <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />
              Telegram
            </span>
          </div>
        </SectionCard>

        {!realtor.phone && (
          <p className="mt-3 rounded-[14px] border border-line bg-surface px-4 py-3 text-[13px] font-semibold text-ink-2">
            Telefon raqami kiritilmagan — e'lon joylash uchun u talab qilinadi.
          </p>
        )}

        <div className="mt-5 flex items-center justify-between">
          <h2 className="text-[15px] font-extrabold tracking-tight">Mening e'lonlarim</h2>
          <Link to="/cabinet/new" className="flex items-center gap-1 text-[13px] font-bold text-accent">
            <span className="text-base leading-none">＋</span> Yangi e'lon
          </Link>
        </div>

        {listingsLoading ? (
          <p className="mt-3 text-[13px] font-semibold text-ink-3">Yuklanmoqda…</p>
        ) : listings.length === 0 ? (
          <SectionCard className="mt-3">
            <p className="py-2 text-center text-[13.5px] font-semibold text-ink-3">
              Hali e'lon yo'q. Birinchisini qo'shing.
            </p>
          </SectionCard>
        ) : (
          <div className="mt-3 flex flex-col gap-2.5">
            {listings.map((listing) => (
              <MyListingRow key={listing.id} listing={listing} />
            ))}
          </div>
        )}

        <SectionCard className="mt-5 py-1">
          <Link
            to="/cabinet/leads"
            className="flex items-center gap-3 border-b border-line/60 py-3.5"
          >
            <span className="min-w-0 flex-1 text-[14.5px] font-bold">Lidlar</span>
            <Icon name="chevronRight" className="h-4 w-4 text-ink-3" strokeWidth={2.4} />
          </Link>
          <Link to="/cabinet/profile" className="flex items-center gap-3 py-3.5">
            <span className="min-w-0 flex-1 text-[14.5px] font-bold">Profilni tahrirlash</span>
            <Icon name="chevronRight" className="h-4 w-4 text-ink-3" strokeWidth={2.4} />
          </Link>
        </SectionCard>

        <button
          type="button"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="mt-5 w-full rounded-[14px] border-[1.5px] border-line py-3.5 text-[15px] font-extrabold text-ink-2 disabled:opacity-60"
        >
          Chiqish
        </button>
      </div>
    </main>
  );
}
