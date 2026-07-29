import type { Agent } from '@rieltor/shared';

/** +998901234567 → "+998 90 123 45 67". Boshqa formatda kelsa o'zgartirmaydi. */
export function formatTel(tel: string): string {
  const m = /^\+998(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(tel);
  return m ? `+998 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : tel;
}

export function AgentCard({ agent }: { agent: Agent }) {
  return (
    <section className="flex items-center gap-3 border-t border-slate-100 px-4 py-4">
      <img
        src={agent.suratUrl}
        alt={agent.ism}
        width={56}
        height={56}
        loading="lazy"
        decoding="async"
        className="h-14 w-14 shrink-0 rounded-full object-cover"
      />
      <div className="min-w-0">
        <p className="font-medium">{agent.ism}</p>
        <p className="text-sm text-slate-500">{agent.agentlik}</p>
        <p className="mt-0.5 text-sm text-slate-700">{formatTel(agent.tel)}</p>
      </div>
    </section>
  );
}
