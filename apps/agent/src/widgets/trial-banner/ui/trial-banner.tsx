/**
 * Trial countdown, shown on the dashboard only while the subscription is still in
 * its free-trial window. Once the trial converts to a paid period (status ACTIVE)
 * the dashboard stops rendering it.
 */
export function TrialBanner({ daysLeft }: { daysLeft: number }) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-accent/20 bg-accent-soft px-4 py-3">
      <span className="text-lg" aria-hidden="true">
        ⏳
      </span>
      <p className="text-[14px] font-semibold text-accent-dark">
        Bepul sinov: {daysLeft} kun qoldi
      </p>
    </div>
  );
}
