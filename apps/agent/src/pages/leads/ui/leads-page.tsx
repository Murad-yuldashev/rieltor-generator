import { useState } from 'react';
import { Link } from 'react-router';
import {
  formatPriceSom,
  type Lead,
  type LeadLostReason,
  type LeadOutcomeStage,
  type LeadStats,
} from '@rieltor/shared';
import { LISTING_TYPE_META } from '@/entities/listing';
import { LeadAssistPanel } from '@/features/lead-assist';
import { useMyLeads, useLeadStats, useSetOutcome, useFixate, useUnfixate } from '@/features/leads';
import { ApiError } from '@/shared/api/client';
import { Icon } from '@/shared/ui/icon';

/** Funnel stages in flow order — drives both the stats summary and the stepper. */
const STAGES: LeadOutcomeStage[] = ['NEW', 'CONTACTED', 'MEETING', 'WON', 'LOST'];

/** The five loss reasons, in declaration order — the LOST reason picker options. */
const REASONS: LeadLostReason[] = [
  'NO_RESPONSE',
  'WRONG_NUMBER',
  'NOT_SERIOUS',
  'BOUGHT_ELSEWHERE',
  'OTHER',
];

const STAGE_LABEL: Record<LeadOutcomeStage, string> = {
  NEW: 'Yangi',
  CONTACTED: "Bog'lanildi",
  MEETING: "Ko'rik",
  WON: 'Bitim',
  LOST: "Yo'qotildi",
};

const REASON_LABEL: Record<LeadLostReason, string> = {
  NO_RESPONSE: "Javob yo'q",
  WRONG_NUMBER: "Raqam noto'g'ri",
  NOT_SERIOUS: 'Jiddiy emas',
  BOUGHT_ELSEWHERE: 'Boshqadan oldi',
  OTHER: 'Boshqa',
};

const DEAL_LABEL: Record<Lead['deal'], string> = {
  SALE: 'Sotib olish',
  RENT: 'Ijara',
};

/** Compact one-line description of what the buyer is looking for. */
function leadMeta(lead: Lead): string {
  const parts: string[] = [];
  if (lead.type) parts.push(LISTING_TYPE_META[lead.type].label);
  if (lead.roomsMin !== null) parts.push(`${lead.roomsMin}+ xona`);
  if (lead.priceMaxSom) parts.push(`${formatPriceSom(lead.priceMaxSom, lead.deal)} gacha`);
  if (lead.areaMinM2 !== null) parts.push(`${lead.areaMinM2} m² dan`);
  return parts.join(' · ');
}

/**
 * "Mening leadlarim" — the realtor's claimed leads plus their personal conversion
 * funnel. The stats summary heads the page; each lead below carries the revealed
 * phone and an outcome stepper for recording where the lead landed.
 */
export function LeadsPage() {
  const { data: leads, isPending, isError } = useMyLeads();
  const { data: stats } = useLeadStats();

  return (
    <main className="mx-auto min-h-dvh max-w-content bg-surface px-4 py-6">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1 text-[13px] font-semibold text-ink-2"
      >
        <Icon name="chevronLeft" className="size-4" />
        Kabinetga qaytish
      </Link>

      <header className="mb-5">
        <p className="text-[13px] font-semibold text-ink-2">Rieltor kabineti</p>
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink">Mening leadlarim</h1>
      </header>

      {stats && <StatsSummary stats={stats} />}

      <section>
        <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-ink-3">
          Olingan leadlar
        </h2>

        {isPending ? (
          <p className="text-[15px] font-semibold text-ink-2">Yuklanmoqda...</p>
        ) : isError || !leads ? (
          <p className="rounded-card bg-card p-4 text-[14px] font-semibold text-brand-rose shadow-card">
            Leadlarni yuklab bo'lmadi. Sahifani yangilang.
          </p>
        ) : leads.length === 0 ? (
          <p className="rounded-card bg-card p-6 text-center text-[14px] font-semibold text-ink-2 shadow-card">
            Hozircha olingan lead yo'q.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {leads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

/** Personal conversion funnel — stage counts, win rate, and the loss breakdown. */
function StatsSummary({ stats }: { stats: LeadStats }) {
  const winRate = stats.winRate == null ? '—' : `${Math.round(stats.winRate * 100)}%`;
  const lostReasons = REASONS.filter((reason) => stats.lostReasons[reason] > 0);

  return (
    <section className="mb-6 rounded-card bg-card p-5 shadow-card">
      <div className="mb-4 flex items-baseline justify-between">
        <p className="text-[13px] font-semibold text-ink-2">Konversiya voronkasi</p>
        <p className="text-[13px] font-semibold text-ink-2">
          G'alaba: <span className="text-[15px] font-extrabold text-ink">{winRate}</span>
        </p>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {STAGES.map((stage) => (
          <div key={stage} className="rounded-[12px] bg-surface px-2 py-3 text-center">
            <p className="text-[20px] font-extrabold leading-none text-ink">
              {stats.funnel[stage]}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-ink-2">{STAGE_LABEL[stage]}</p>
          </div>
        ))}
      </div>

      {lostReasons.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-ink-3">
            Yo'qotish sabablari
          </p>
          <ul className="flex flex-col gap-1.5">
            {lostReasons.map((reason) => (
              <li key={reason} className="flex items-center justify-between text-[13px]">
                <span className="font-medium text-ink-2">{REASON_LABEL[reason]}</span>
                <span className="font-bold text-ink">{stats.lostReasons[reason]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/**
 * One claimed lead: its summary, the revealed phone, and the outcome stepper.
 * Each card owns its own mutation so only the card being updated is disabled.
 * Choosing LOST reveals the reason picker; the outcome is recorded only once a
 * reason is chosen — every other stage records immediately.
 */
function LeadCard({ lead }: { lead: Lead }) {
  const setOutcome = useSetOutcome();
  // Reveal the reason picker once LOST is chosen (or the lead is already lost);
  // the outcome is recorded only after a reason is selected below.
  const [showReason, setShowReason] = useState(lead.outcomeStage === 'LOST');
  const lostMode = lead.outcomeStage === 'LOST' || showReason;

  function pickStage(stage: LeadOutcomeStage) {
    if (stage === 'LOST') {
      setShowReason(true);
      return;
    }
    setShowReason(false);
    setOutcome.mutate({ id: lead.id, stage });
  }

  return (
    <li className="rounded-card bg-card p-4 shadow-card">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-bold text-ink">
            {lead.district ?? 'Tuman ko‘rsatilmagan'}
          </p>
          <p className="mt-0.5 text-[13px] font-medium text-ink-2">{leadMeta(lead)}</p>
        </div>
        <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-[12px] font-bold text-accent">
          {DEAL_LABEL[lead.deal]}
        </span>
      </div>

      {lead.note && <p className="mb-2 text-[13px] font-medium text-ink-2">{lead.note}</p>}

      {lead.phone && (
        <a
          href={`tel:${lead.phone}`}
          className="mb-3 inline-flex items-center gap-1.5 text-[14px] font-bold text-accent"
        >
          <Icon name="phone" className="size-4" />
          {lead.phone}
        </a>
      )}

      {lead.type === 'NEW_BUILD' && lead.unitInfo && (
        <FixationPanel lead={lead} unit={lead.unitInfo} />
      )}

      <div className="flex flex-wrap gap-1.5">
        {STAGES.map((stage) => {
          const active = stage === 'LOST' ? lostMode : !lostMode && lead.outcomeStage === stage;
          return (
            <button
              key={stage}
              type="button"
              aria-pressed={active}
              disabled={setOutcome.isPending}
              onClick={() => pickStage(stage)}
              className={
                active
                  ? 'rounded-full bg-accent px-3 py-1.5 text-[13px] font-semibold text-white disabled:opacity-50'
                  : 'rounded-full bg-surface px-3 py-1.5 text-[13px] font-semibold text-ink-2 disabled:opacity-50'
              }
            >
              {STAGE_LABEL[stage]}
            </button>
          );
        })}
      </div>

      {lostMode && (
        <select
          value={lead.lostReason ?? ''}
          disabled={setOutcome.isPending}
          onChange={(event) => {
            const reason = event.target.value;
            if (reason) {
              setOutcome.mutate({
                id: lead.id,
                stage: 'LOST',
                lostReason: reason as LeadLostReason,
              });
            }
          }}
          aria-label="Yo'qotish sababi"
          className="mt-2 w-full rounded-[12px] border border-line bg-card px-3.5 py-2.5 text-[14px] font-semibold text-ink outline-none focus:border-accent disabled:opacity-50"
        >
          <option value="">Sababni tanlang</option>
          {REASONS.map((reason) => (
            <option key={reason} value={reason}>
              {REASON_LABEL[reason]}
            </option>
          ))}
        </select>
      )}

      {setOutcome.isError && (
        <p className="mt-2 text-[13px] font-semibold text-brand-rose">
          Saqlab bo'lmadi. Qayta urinib ko'ring.
        </p>
      )}

      <LeadAssistPanel leadId={lead.id} />
    </li>
  );
}

/**
 * The NEW_BUILD target unit of a claimed lead: its complex + unit + price, the
 * realtor-facing **estimated** commission, and the fixation controls. Owns its own
 * mutations so only this lead's card is busy while fixating. The fixation state is
 * server truth (`lead.fixation`): null/CANCELLED offers "Fiksatsiya qilish", ACTIVE
 * shows the badge + "Bekor qilish", CONVERTED shows the commission actually earned.
 *
 * Commission figures are lump sums, so they are formatted with `'SALE'` (no `/oy`
 * monthly suffix) regardless of the lead's own deal.
 */
function FixationPanel({ lead, unit }: { lead: Lead; unit: NonNullable<Lead['unitInfo']> }) {
  const fixate = useFixate(lead.id);
  const unfixate = useUnfixate(lead.id);
  const fixation = lead.fixation;
  const busy = fixate.isPending || unfixate.isPending;

  // The fixate 409 (the unit already has an ACTIVE fixation for another client) carries
  // a ready-to-show Uzbek message; surface it verbatim. Any other failure keeps the
  // generic copy so an unexpected error can't leak an internal string.
  const fixateError =
    fixate.error instanceof ApiError && fixate.error.status === 409
      ? fixate.error.message
      : fixate.isError
        ? "Fiksatsiya qilib bo'lmadi. Qayta urinib ko'ring."
        : null;

  return (
    <div className="mb-3 rounded-[12px] bg-surface p-3.5">
      <p className="text-[12px] font-bold uppercase tracking-wide text-ink-3">Yangi bino</p>
      <p className="mt-1 text-[14px] font-bold text-ink">
        {unit.complexName} · {unit.number}-xonadon
      </p>
      {unit.priceSom && (
        <p className="mt-0.5 text-[13px] font-semibold text-ink-2">
          {formatPriceSom(unit.priceSom, 'SALE')}
        </p>
      )}
      {unit.commissionSom && (
        <p className="mt-0.5 text-[13px] font-medium text-ink-2">
          Taxminiy komissiya:{' '}
          <span className="font-extrabold text-ink">
            {formatPriceSom(unit.commissionSom, 'SALE')}
          </span>
        </p>
      )}

      {(!fixation || fixation.status === 'CANCELLED') && (
        <div className="mt-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => fixate.mutate(lead.unitId ? { unitId: lead.unitId } : undefined)}
            className="rounded-full bg-accent px-3.5 py-1.5 text-[13px] font-semibold text-white disabled:opacity-50"
          >
            Fiksatsiya qilish
          </button>
          {fixateError && (
            <p className="mt-2 text-[13px] font-semibold text-brand-rose">{fixateError}</p>
          )}
        </div>
      )}

      {fixation?.status === 'ACTIVE' && (
        <div className="mt-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[12px] font-bold text-accent">
              Fiksatsiya qilingan
            </span>
            <button
              type="button"
              disabled={busy}
              onClick={() => unfixate.mutate()}
              className="rounded-full bg-card px-3 py-1.5 text-[13px] font-semibold text-ink-2 disabled:opacity-50"
            >
              Bekor qilish
            </button>
          </div>
          {unfixate.isError && (
            <p className="mt-2 text-[13px] font-semibold text-brand-rose">
              Bekor qilib bo'lmadi. Qayta urinib ko'ring.
            </p>
          )}
        </div>
      )}

      {fixation?.status === 'CONVERTED' && (
        <p className="mt-3 text-[13px] font-bold text-ink">
          Komissiya olindi
          {fixation.commissionSom ? ` — ${formatPriceSom(fixation.commissionSom, 'SALE')}` : ''}
        </p>
      )}
    </div>
  );
}
