import { nextLeadStatuses, type Lead } from '@rieltor/shared';
import { formatPhone } from '@/entities/realtor';
import { LEAD_STATUS_META, LEAD_TRANSITION_LABEL, useAdvanceLeadStatus } from '@/features/leads';
import { cn } from '@/shared/lib/cn';

const MONTHS = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentabr',
  'oktabr',
  'noyabr',
  'dekabr',
] as const;

/** createdAt is a full ISO timestamp (unlike entities/listing's listedAt, which is
 *  date-only), so it needs its own formatter rather than reusing formatListedAt. An
 *  unparseable value is shown as-is rather than crashing the row. */
function formatLeadDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${date.getDate()}-${MONTHS[date.getMonth()]}, ${hh}:${mm}`;
}

interface Props {
  lead: Lead;
  /** Looked up by listingId on the page from the realtor's own listing list —
   *  features/leads may not import features/listing-form (FSD forbids one feature
   *  importing another), so the join happens one layer up. null only if the listing
   *  list has not loaded yet or (should not normally happen) no longer contains it. */
  listingTitle: string | null;
}

/** A row on /cabinet/leads (design spec §8.4): name, phone (tel: link), which
 *  listing it came from, when, the current status, and buttons for every status
 *  nextLeadStatuses(lead.status) allows moving to next. */
export function LeadRow({ lead, listingTitle }: Props) {
  const advance = useAdvanceLeadStatus();
  const meta = LEAD_STATUS_META[lead.status];
  const targets = nextLeadStatuses(lead.status);

  return (
    <div className="rounded-card border border-line/60 bg-card p-3.5 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14.5px] font-extrabold text-ink">{lead.name}</p>
          <a
            href={`tel:${lead.phone}`}
            className="mt-0.5 block text-[13.5px] font-bold text-accent"
          >
            {formatPhone(lead.phone)}
          </a>
        </div>
        <span
          className={cn(
            'inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold text-white',
            meta.badge,
          )}
        >
          {meta.label}
        </span>
      </div>

      <p className="mt-2 truncate text-[12.5px] font-semibold text-ink-3">
        {listingTitle ?? "E'lon"} · {formatLeadDate(lead.createdAt)}
      </p>

      {targets.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-2 border-t border-line/60 pt-2.5">
          {targets.map((to) => (
            <button
              key={to}
              type="button"
              onClick={() => advance.mutate({ id: lead.id, status: to })}
              disabled={advance.isPending}
              className="rounded-full border border-line px-3.5 py-2 text-[12.5px] font-bold text-ink-2 disabled:opacity-60"
            >
              {LEAD_TRANSITION_LABEL[to] ?? to}
            </button>
          ))}
        </div>
      )}

      {advance.isError && (
        <p className="mt-2 text-[12.5px] font-bold text-red-600">Holatni o'zgartirib bo'lmadi.</p>
      )}
    </div>
  );
}
