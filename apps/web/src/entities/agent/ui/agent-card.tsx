import { useTranslation } from 'react-i18next';
import type { Agent } from '@rieltor/shared';

/** +998901234567 → "+998 90 123 45 67". Any other shape is returned untouched. */
export function formatPhone(phone: string): string {
  const m = /^\+998(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(phone);
  return m ? `+998 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : phone;
}

export function AgentCard({ agent }: { agent: Agent }) {
  const { t } = useTranslation('listing');
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
            {t('agent.verifiedBadge')}
          </span>
        </p>
        <p className="mt-0.5 text-[12.5px] font-semibold text-ink-3">{agent.agency}</p>
        <a href={`tel:${agent.phone}`} className="mt-0.5 block text-[13.5px] font-bold text-accent">
          {formatPhone(agent.phone)}
        </a>
      </div>
    </div>
  );
}
