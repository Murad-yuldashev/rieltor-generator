import { Link } from 'react-router';
import { TelegramLoginButton, useLogout, useMe } from '@/features/auth';
import { Icon } from '@/shared/ui/icon';
import { PageHeading } from '@/shared/ui/page-heading';
import { SectionCard } from '@/shared/ui/section-card';

export function CabinetPage() {
  const { realtor, isLoading } = useMe();
  const logout = useLogout();

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

        <SectionCard className="mt-3 py-1">
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
