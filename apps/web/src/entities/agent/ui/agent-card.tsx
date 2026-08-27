import type { Agent } from '@rieltor/shared';
import { Link } from 'react-router';
import { Icon } from '@/shared/ui/icon';

export function AgentCard({ agent }: { agent: Agent }) {
  // The default Agent (seed listings) carries no profileSlug — those keep the
  // Phase-1 static "verified" badge exactly as before, so the marketplace stays
  // visually unchanged. A real published realtor (profileSlug set) earns the
  // badge only once a moderator has verified them, and always links to their
  // public microsite.
  const isRealRealtor = agent.profileSlug !== null;
  const showVerifiedBadge = isRealRealtor ? agent.verified : true;

  return (
    <div className="flex items-center gap-3">
      <img
        src={agent.photoUrl}
        alt={agent.name}
        width={52}
        height={52}
        loading="lazy"
        decoding="async"
        className="h-13 w-13 shrink-0 rounded-full bg-accent-soft object-cover"
      />
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-1.5 text-[15.5px] font-extrabold">
          {agent.name}
          {showVerifiedBadge && (
            <span className="rounded-full bg-brand-green/10 px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide text-brand-green">
              ✓ TEKSHIRILGAN
            </span>
          )}
        </p>
        <p className="mt-0.5 text-[12.5px] font-semibold text-ink-3">{agent.agency}</p>
        {/* Masked here — the real number only appears via the StickyCTA's tracked reveal. */}
        <p className="mt-0.5 text-[13.5px] font-bold text-accent">{agent.phoneMasked}</p>
        {agent.profileSlug && (
          <Link
            to={`/r/${agent.profileSlug}`}
            className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-bold text-accent hover:underline"
          >
            Rieltor sahifasi
            <Icon name="chevronRight" className="h-3.5 w-3.5" strokeWidth={2.4} />
          </Link>
        )}
      </div>
    </div>
  );
}
