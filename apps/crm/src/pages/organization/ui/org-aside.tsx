import { Link } from 'react-router';
import type { Organization, OrgMember, OrgRole } from '@rieltor/shared';
import { useRequestVerification } from '@/features/developer';
import { cn } from '@/shared/lib/cn';
import { Icon, type IconName } from '@/shared/ui/icon';

/** Uzbek labels for a member's role within the organization (UI copy only). */
const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  OWNER: 'Egasi',
  MANAGER: 'Menejer',
};

/** Cabinet sections surfaced as a quick-nav list, replacing the old lone link card. */
const QUICK_LINKS: { to: string; icon: IconName; label: string }[] = [
  { to: '/complexes', icon: 'rooms', label: 'Majmualar' },
  { to: '/bookings', icon: 'calendar', label: 'Bandlar' },
  { to: '/contracts', icon: 'doc', label: 'Shartnomalar' },
  { to: '/finance', icon: 'chart', label: 'Moliya' },
  { to: '/wallet', icon: 'money', label: 'Hisob' },
];

/**
 * Verification status card — unchanged behaviour from the old dashboard: shows the
 * org's verified / pending / unverified state and, when neither, a request button.
 */
export function VerificationCard({ org, className }: { org: Organization; className?: string }) {
  const requestVerification = useRequestVerification();

  // Verification state: pending once a request exists but no badge is granted yet.
  const isVerificationPending = org.verificationRequestedAt != null && !org.verified;
  const verificationLabel = org.verified
    ? 'Tasdiqlangan'
    : isVerificationPending
      ? 'Kutilmoqda'
      : 'Tasdiqlanmagan';
  const verificationBadge = org.verified
    ? 'bg-brand-green/10 text-brand-green'
    : isVerificationPending
      ? 'bg-brand-amber/10 text-brand-amber'
      : 'bg-ink-3/10 text-ink-2';
  const canRequestVerification = !org.verified && !isVerificationPending;

  return (
    <section className={cn('rounded-card bg-card p-5 shadow-card', className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold text-ink">Tasdiqlanish holati</h2>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-bold ${verificationBadge}`}
        >
          {verificationLabel}
        </span>
      </div>
      <p className="mt-1 text-[13px] text-ink-2">
        Tasdiqdan o'tgan tashkilotgina majmualarni marketpleysda e'lon qila oladi.
      </p>

      {canRequestVerification && (
        <button
          type="button"
          onClick={() => requestVerification.mutate()}
          disabled={requestVerification.isPending}
          className="mt-4 w-full rounded-[14px] bg-linear-to-br from-accent to-accent-dark px-6 py-3 text-[15px] font-extrabold text-white shadow-lg shadow-accent/35 disabled:opacity-60"
        >
          {requestVerification.isPending ? 'Yuborilmoqda...' : "Tasdiqlanish so'rovi"}
        </button>
      )}

      {requestVerification.isError && (
        <p className="mt-3 text-center text-[13px] font-semibold text-brand-rose">
          So'rovni yuborishda xatolik. Qayta urinib ko'ring.
        </p>
      )}
    </section>
  );
}

/** Compact members list — each member's name/phone with their role pill. */
export function MembersCard({
  members,
  currentUserId,
  className,
}: {
  members: OrgMember[];
  currentUserId: string | undefined;
  className?: string;
}) {
  return (
    <section className={cn('rounded-card bg-card p-5 shadow-card', className)}>
      <h2 className="text-[15px] font-bold text-ink">A'zolar</h2>
      {members.length === 0 ? (
        <p className="mt-3 text-[14px] text-ink-3">Hozircha a'zolar yo'q</p>
      ) : (
        <ul className="mt-2 flex flex-col divide-y divide-line">
          {members.map((member) => {
            const isMe = member.userId === currentUserId;
            return (
              <li key={member.userId} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold text-ink">
                    {member.name ?? member.phone}
                    {isMe && <span className="ml-1.5 text-[12px] text-ink-3">(Siz)</span>}
                  </p>
                  <p className="truncate text-[13px] text-ink-3">{member.phone}</p>
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
  );
}

/** Quick-nav list to the cabinet's main sections. */
export function QuickLinks({ className }: { className?: string }) {
  return (
    <nav
      className={cn('rounded-card bg-card p-2 shadow-card', className)}
      aria-label="Tezkor havolalar"
    >
      <ul className="flex flex-col">
        {QUICK_LINKS.map(({ to, icon, label }) => (
          <li key={to}>
            <Link
              to={to}
              className="flex items-center gap-3 rounded-[12px] px-3 py-2.5 hover:bg-surface"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-accent-soft text-accent">
                <Icon name={icon} className="h-[17px] w-[17px]" strokeWidth={2.1} />
              </span>
              <span className="flex-1 text-[14px] font-semibold text-ink">{label}</span>
              <Icon name="chevronRight" className="h-4 w-4 shrink-0 text-ink-3" strokeWidth={2.2} />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
