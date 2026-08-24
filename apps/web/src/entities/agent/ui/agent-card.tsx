import type { Agent } from '@rieltor/shared';

export function AgentCard({ agent }: { agent: Agent }) {
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
          <span className="rounded-full bg-brand-green/10 px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide text-brand-green">
            ✓ TEKSHIRILGAN
          </span>
        </p>
        <p className="mt-0.5 text-[12.5px] font-semibold text-ink-3">{agent.agency}</p>
        {/* Masked here — the real number only appears via the StickyCTA's tracked reveal. */}
        <p className="mt-0.5 text-[13.5px] font-bold text-accent">{agent.phoneMasked}</p>
      </div>
    </div>
  );
}
