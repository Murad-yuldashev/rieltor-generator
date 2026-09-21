import type { SubscriptionStatus, SubscriptionView } from '@rieltor/shared';
import { cn } from '@/shared/lib/cn';

/** Uzbek labels for the subscription lifecycle status (UI copy only). */
const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  TRIAL: 'Bepul sinov',
  ACTIVE: 'Faol obuna',
  EXPIRED: 'Muddati tugagan',
};

/** Badge tint per status — teal-family greens/ambers/roses, no CRM blue. */
const STATUS_BADGE: Record<SubscriptionStatus, string> = {
  ACTIVE: 'bg-brand-green/10 text-brand-green',
  TRIAL: 'bg-brand-amber/10 text-brand-amber',
  EXPIRED: 'bg-brand-rose/10 text-brand-rose',
};

/**
 * Subscription status card (ASIDE) — the realtor's plan state as a status badge with
 * a days-left line. The page gate guarantees a subscription for a REALTOR, but the
 * prop stays nullable and the card renders nothing when absent.
 */
export function SubscriptionCard({
  subscription,
  className,
}: {
  subscription: SubscriptionView | null | undefined;
  className?: string;
}) {
  if (subscription == null) {
    return null;
  }

  return (
    <section className={cn('rounded-card bg-card p-5 shadow-card', className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold text-ink">Obuna</h2>
        <span
          className={cn(
            'shrink-0 rounded-full px-3 py-1 text-[12px] font-bold',
            STATUS_BADGE[subscription.status],
          )}
        >
          {STATUS_LABEL[subscription.status]}
        </span>
      </div>
      <p className="mt-2 text-[24px] font-extrabold leading-tight text-ink">
        {`${subscription.daysLeft} kun qoldi`}
      </p>
    </section>
  );
}
