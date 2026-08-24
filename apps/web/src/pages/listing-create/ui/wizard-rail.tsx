import { STEP_META, stepMeta } from '../model/steps';
import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';

/**
 * Left rail: a big badge for the current step (spec's "illustration" slot —
 * this app draws no bespoke art, so the same inline-icon system every other
 * page uses stands in), its title and hint, a progress bar, then the compact
 * numbered stepper for the other five. Below 1440px this sits above the form
 * instead of beside it (the page's grid collapses to one column there).
 */
export function WizardRail({ step }: { step: number }) {
  const current = stepMeta(step);
  const progress = ((step + 1) / STEP_META.length) * 100;

  return (
    <aside>
      <div className="flex items-center gap-3.5 desk:flex-col desk:items-start desk:gap-0">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-accent-soft text-accent desk:h-14 desk:w-14">
          <Icon name={current.icon} className="h-6 w-6 desk:h-7 desk:w-7" strokeWidth={2} />
        </span>
        <div className="desk:mt-4">
          <p className="text-[13px] font-bold text-ink-3">
            {step + 1}-qadam / {STEP_META.length}
          </p>
          <h1 className="text-[19px] leading-tight font-extrabold tracking-tight desk:text-[22px]">
            {current.title}
          </h1>
        </div>
      </div>

      <p className="mt-3 text-[13.5px] leading-relaxed text-ink-2 desk:mt-2.5">{current.hint}</p>

      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-linear-to-r from-violet-600 to-accent-dark transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ol className="mt-5 hidden desk:flex desk:flex-col desk:gap-1">
        {STEP_META.map((meta, i) => {
          const state = i < step ? 'done' : i === step ? 'current' : 'upcoming';
          return (
            <li key={meta.title} className="flex items-center gap-3 py-1.5">
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold',
                  state === 'done' && 'bg-accent text-white',
                  state === 'current' && 'bg-accent text-white',
                  state === 'upcoming' && 'bg-surface text-ink-3',
                )}
              >
                {state === 'done' ? (
                  <Icon name="check" className="h-3 w-3" strokeWidth={3} />
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={cn(
                  'text-[13px] font-bold',
                  state === 'upcoming' ? 'text-ink-3' : 'text-ink',
                )}
              >
                {meta.title}
              </span>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
