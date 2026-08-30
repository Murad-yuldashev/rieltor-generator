import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { LeadClaimResponse } from '@rieltor/shared';
import { useClaimLead } from '@/entities/property-request';
import { ApiError } from '@/shared/api/client';
import { Icon } from '@/shared/ui/icon';

/**
 * "Lead'ni olish" for the realtor board: the lead lists a masked phone, so
 * tapping this exclusively claims the lead — the API hands back the buyer's real
 * `{ phone, name }` and drops the lead from every realtor's OPEN feed. The claim
 * is a race: a 409 means someone else took it first (the feed refetches so the
 * stale card disappears), a 400 is a self-claim whose server message is shown.
 *
 * On a win the claim also invalidates `['leads']`, so this card unmounts as the
 * now-CLAIMED lead leaves the OPEN feed. The revealed contact therefore cannot
 * live in this component's local state alone — it is lifted to the page via
 * `onClaimed`, which renders a persistent panel outside the feed list.
 */
export function ClaimButton({
  id,
  onClaimed,
}: {
  id: string;
  onClaimed?: (contact: LeadClaimResponse) => void;
}) {
  const qc = useQueryClient();
  const claim = useClaimLead();
  const [contact, setContact] = useState<LeadClaimResponse | null>(null);

  if (contact) {
    return (
      <div className="flex flex-col gap-0.5">
        {contact.name && <span className="text-[13px] font-bold text-ink-2">{contact.name}</span>}
        <a
          href={`tel:${contact.phone}`}
          className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-green/10 px-3.5 py-2 text-[14px] font-extrabold text-brand-green"
        >
          <Icon name="phone" className="h-4 w-4" strokeWidth={2.2} />
          {contact.phone}
        </a>
      </div>
    );
  }

  // A 409 (already claimed) and a 400 (self-claim) are the two lead-specific
  // failures worth naming; anything else falls back to a generic retry line.
  const errorText = claim.error
    ? claim.error instanceof ApiError && claim.error.status === 409
      ? 'Bu lead allaqachon olingan'
      : claim.error instanceof ApiError && claim.error.status === 400
        ? claim.error.message
        : "Xatolik yuz berdi. Qaytadan urinib ko'ring."
    : null;

  async function onClick() {
    try {
      const revealed = await claim.mutateAsync(id);
      // Show the reveal here for the brief window before the card unmounts, and
      // lift it to the page so it survives the ['leads'] refetch that removes it.
      setContact(revealed);
      onClaimed?.(revealed);
    } catch (err) {
      // onSuccess refetches on a win; a 409 means the lead is already gone, so
      // refetch here too to drop the stale card. The caught error otherwise just
      // feeds the inline message above — no rethrow, the button re-enables.
      if (err instanceof ApiError && err.status === 409) {
        void qc.invalidateQueries({ queryKey: ['leads'] });
      }
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={onClick}
        disabled={claim.isPending}
        className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent px-3.5 py-2 text-[13.5px] font-extrabold text-white shadow-lg shadow-accent/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Icon name="phone" className="h-4 w-4" strokeWidth={2.2} />
        {claim.isPending ? 'Yuklanmoqda...' : "Lead'ni olish"}
      </button>
      {errorText && (
        <span className="text-[12.5px] font-semibold text-brand-rose">{errorText}</span>
      )}
    </div>
  );
}
