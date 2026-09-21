import type { LeadOutcomeStage, LeadStats } from '@rieltor/shared';
import { cn } from '@/shared/lib/cn';

const FLOW_STAGES: Exclude<LeadOutcomeStage, 'LOST'>[] = ['NEW', 'CONTACTED', 'MEETING', 'WON'];

const STAGE_LABEL: Record<LeadOutcomeStage, string> = {
  NEW: 'Yangi',
  CONTACTED: "Bog'lanildi",
  MEETING: "Ko'rik",
  WON: 'Bitim',
  LOST: "Yo'qotildi",
};

/**
 * Lead conversion funnel — pure-CSS horizontal bars over `leadStats.funnel`
 * (NEW→CONTACTED→MEETING→WON) with a rose LOST tail and a null-safe win-rate line.
 * Each bar's width is its share of the largest flow stage. Teal accent only.
 */
export function LeadPipelinePanel({
  stats,
  className,
}: {
  stats: LeadStats | undefined;
  className?: string;
}) {
  const funnel = stats?.funnel;
  const maxFlow = funnel ? Math.max(1, ...FLOW_STAGES.map((s) => funnel[s])) : 1;
  // winRate is a 0..1 FRACTION (WON/(WON+LOST)); null when no resolved leads.
  const winRate =
    stats == null || stats.winRate == null ? '—' : `${Math.round(stats.winRate * 100)}%`;

  return (
    <section className={cn('rounded-card bg-card p-5 shadow-card', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-bold text-ink">Leadlar voronkasi</h2>
        <span className="text-[13px] font-semibold text-ink-2">
          G'alaba: <span className="text-[15px] font-extrabold text-ink">{winRate}</span>
        </span>
      </div>

      {funnel == null ? (
        <p className="mt-3 text-[14px] text-ink-3">Yuklanmoqda...</p>
      ) : (
        <>
          <ul className="mt-4 flex flex-col gap-2.5">
            {FLOW_STAGES.map((stage) => {
              const count = funnel[stage];
              const percent = Math.min(100, Math.max(0, (count / maxFlow) * 100));
              return (
                <li key={stage} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-[13px] font-semibold text-ink-2">
                    {STAGE_LABEL[stage]}
                  </span>
                  <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-accent-soft">
                    <span
                      className="block h-full rounded-full bg-accent transition-[width]"
                      style={{ width: `${percent}%` }}
                    />
                  </span>
                  <span className="w-8 shrink-0 text-right text-[13px] font-extrabold text-ink">
                    {count}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="mt-2.5 flex items-center gap-3 border-t border-line pt-2.5">
            <span className="w-24 shrink-0 text-[13px] font-semibold text-brand-rose">
              {STAGE_LABEL.LOST}
            </span>
            <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-brand-rose/10">
              <span
                className="block h-full rounded-full bg-brand-rose transition-[width]"
                style={{ width: `${Math.min(100, (funnel.LOST / maxFlow) * 100)}%` }}
              />
            </span>
            <span className="w-8 shrink-0 text-right text-[13px] font-extrabold text-ink">
              {funnel.LOST}
            </span>
          </div>
        </>
      )}
    </section>
  );
}
