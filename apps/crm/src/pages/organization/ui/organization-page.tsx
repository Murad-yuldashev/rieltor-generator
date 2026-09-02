import { Link } from 'react-router';
import type { OrgRole } from '@rieltor/shared';
import { useSession } from '@/entities/session';
import { useOrg } from '@/features/developer';
import { CabinetNav } from '@/widgets/cabinet-nav';

/** Uzbek labels for a member's role within the organization (UI copy only). */
const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  OWNER: 'Egasi',
  MANAGER: 'Menejer',
};

const SHELL = 'mx-auto flex min-h-dvh max-w-content flex-col gap-5 bg-surface px-5 py-8';

/**
 * Cabinet home (`/`). Shows the developer organization — its name, district and
 * members (read-only) — and links through to the complexes. The org itself is
 * created by the become-developer onboarding, so under this guard it always
 * exists; the loading/error branches just cover the fetch.
 */
export function OrganizationPage() {
  const { data: org, isPending, isError } = useOrg();
  const { user } = useSession();

  if (isPending) {
    return (
      <main className={SHELL}>
        <CabinetNav />
        <p className="text-[15px] font-semibold text-ink-2">Yuklanmoqda...</p>
      </main>
    );
  }

  if (isError || !org) {
    return (
      <main className={SHELL}>
        <CabinetNav />
        <p className="text-[14px] font-semibold text-brand-rose">
          Tashkilot ma'lumotini yuklab bo'lmadi. Qayta urinib ko'ring.
        </p>
      </main>
    );
  }

  return (
    <main className={SHELL}>
      <CabinetNav />

      <header>
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink">{org.name}</h1>
        <p className="mt-1 text-[14px] text-ink-2">{org.district ?? 'Tuman ko‘rsatilmagan'}</p>
      </header>

      <section className="rounded-card bg-card p-5 shadow-card">
        <h2 className="text-[15px] font-bold text-ink">A'zolar</h2>
        {org.members.length === 0 ? (
          <p className="mt-3 text-[14px] text-ink-3">Hozircha a'zolar yo'q</p>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-line">
            {org.members.map((member) => {
              const isMe = member.userId === user?.id;
              return (
                <li key={member.userId} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-ink">
                      {member.name ?? member.phone}
                      {isMe && <span className="ml-1.5 text-[12px] text-ink-3">(Siz)</span>}
                    </p>
                    <p className="text-[13px] text-ink-3">{member.phone}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-accent-soft px-3 py-1 text-[12px] font-bold text-accent">
                    {ORG_ROLE_LABELS[member.role]}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Link
        to="/complexes"
        className="flex items-center justify-between rounded-card bg-card p-5 shadow-card"
      >
        <span>
          <span className="block text-[15px] font-bold text-ink">Turar-joy majmualari</span>
          <span className="mt-0.5 block text-[13px] text-ink-2">
            Majmualar, binolar va xonadonlarni boshqaring
          </span>
        </span>
        <span className="text-[20px] text-ink-3" aria-hidden="true">
          &rsaquo;
        </span>
      </Link>
    </main>
  );
}
