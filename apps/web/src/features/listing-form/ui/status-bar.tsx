import type { UseMutationResult } from '@tanstack/react-query';
import { allowedTransitions, type ListingStatus } from '@rieltor/shared';
import { Link } from 'react-router';
import { PUBLIC_DETAIL_STATUSES } from '@/entities/listing';
import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';
import { SectionCard } from '@/shared/ui/section-card';
import { STATUS_META, TRANSITION_LABEL } from '../lib/status-meta';

interface Props {
  listingId: string;
  status: ListingStatus;
  missing: string[];
  hasPhone: boolean;
  save: UseMutationResult<{ id: string }, Error, void>;
  transition: UseMutationResult<{ status: ListingStatus }, Error, ListingStatus>;
  /** Opens the share screen (design spec §8.1) — called right after a DRAFT→ACTIVE
   *  publish succeeds, and also from the "Ulashish" button below for a re-share. */
  onShare: () => void;
}

/**
 * Saqlash (always available — PATCH does not care about status), the DRAFT-only
 * publish button gated on `missing`, and every other §7.4 transition the realtor may
 * request from the current status, read straight off the shared allowedTransitions().
 */
export function StatusBar({
  listingId,
  status,
  missing,
  hasPhone,
  save,
  transition,
  onShare,
}: Props) {
  const meta = STATUS_META[status];
  // DRAFT→ACTIVE is the publish button below, rendered on its own — every other
  // allowed target lands in the plain transition-button row.
  const otherTargets = allowedTransitions(status, 'realtor').filter(
    (to) => !(status === 'DRAFT' && to === 'ACTIVE'),
  );

  return (
    <SectionCard className="mt-4" title="Holat">
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            'inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold text-white',
            meta.badge,
          )}
        >
          {meta.label}
        </span>

        <div className="flex items-center gap-3.5">
          <Link
            to={`/cabinet/obj/${listingId}/stats`}
            className="flex items-center gap-1 text-[12.5px] font-bold text-ink-2"
          >
            <Icon name="eye" className="h-3.5 w-3.5" strokeWidth={2.2} />
            Statistika
          </Link>
          {/* A DRAFT/PENDING/ARCHIVED listing 404s for everyone but its owner — sharing
              its link would be pointless (entities/listing's PUBLIC_DETAIL_STATUSES,
              mirroring the API's own visibility rule, §5.3). */}
          {PUBLIC_DETAIL_STATUSES.has(status) && (
            <button
              type="button"
              onClick={onShare}
              className="flex items-center gap-1 text-[12.5px] font-bold text-accent"
            >
              <Icon name="share" className="h-3.5 w-3.5" strokeWidth={2.2} />
              Ulashish
            </button>
          )}
        </div>
      </div>

      {status === 'PENDING' && (
        <p className="mt-2 text-[13px] font-semibold text-ink-2">
          E'lon moderatsiyada — admin ko'rib chiqqach chiqadi.
        </p>
      )}

      {status === 'DRAFT' && missing.length > 0 && (
        <div className="mt-2.5 rounded-[12px] bg-surface px-3 py-2.5 text-[13px] text-ink-2">
          <p className="font-bold text-ink">Nashr qilish uchun to'ldiring:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 font-semibold">
            {missing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {!hasPhone && (
            <Link to="/cabinet/profile" className="mt-1.5 inline-block font-bold text-accent">
              Profilni to'ldirish →
            </Link>
          )}
        </div>
      )}

      <div className="mt-3 flex gap-2.5">
        <button
          type="button"
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="flex-1 rounded-[14px] border-[1.5px] border-line py-3 text-[14.5px] font-extrabold text-ink-2 disabled:opacity-60"
        >
          {save.isPending ? 'Saqlanmoqda…' : 'Saqlash'}
        </button>

        {status === 'DRAFT' && (
          <button
            type="button"
            onClick={() =>
              transition.mutate('ACTIVE', {
                // Untrusted realtors land on PENDING instead (§7.4) — the share
                // screen only makes sense once the listing is actually live.
                onSuccess: (result) => {
                  if (result.status === 'ACTIVE') onShare();
                },
              })
            }
            disabled={transition.isPending || missing.length > 0}
            className="flex-1 rounded-[14px] bg-accent py-3 text-[14.5px] font-extrabold text-white disabled:opacity-60"
          >
            {transition.isPending ? 'Yuborilmoqda…' : "E'lon berish"}
          </button>
        )}
      </div>

      {save.isError && (
        <p className="mt-2 text-[13px] font-bold text-red-600">Saqlashda xatolik.</p>
      )}
      {save.isSuccess && <p className="mt-2 text-[13px] font-bold text-emerald-600">Saqlandi</p>}

      {otherTargets.length > 0 && (
        <div className="mt-3.5 border-t border-line pt-3.5">
          <p className="mb-2 text-xs font-bold text-ink-3">Holatni o'zgartirish</p>
          <div className="flex flex-wrap gap-2">
            {otherTargets.map((to) => (
              <button
                key={to}
                type="button"
                onClick={() => transition.mutate(to)}
                disabled={transition.isPending}
                className="rounded-full border border-line px-3.5 py-2 text-[12.5px] font-bold text-ink-2 disabled:opacity-60"
              >
                {TRANSITION_LABEL[to] ?? to}
              </button>
            ))}
          </div>
        </div>
      )}

      {transition.isError && (
        <p className="mt-2 text-[13px] font-bold text-red-600">Holatni o'zgartirib bo'lmadi.</p>
      )}
      {transition.isSuccess && transition.data && (
        <p className="mt-2 text-[13px] font-bold text-emerald-600">
          Holat: {STATUS_META[transition.data.status].label}
        </p>
      )}
    </SectionCard>
  );
}
