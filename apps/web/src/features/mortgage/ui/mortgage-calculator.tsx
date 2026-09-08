import { useState } from 'react';
import { formatPriceSom, type MortgageProgram } from '@rieltor/shared';
import { cn } from '@/shared/lib/cn';
import { computeMortgage } from '@/shared/lib/mortgage';
import { useMortgagePrograms } from '../use-mortgage';

interface Props {
  /**
   * Prefill the price on a listing-detail widget. A string (BigInt-as-string) to
   * match the listing payload. Absent on the standalone `/ipoteka` page, where the
   * buyer types the price — the default kicks in so the outputs are never 0-on-load.
   */
  initialPriceSom?: string;
}

const inputClass =
  'w-full rounded-[14px] border border-line bg-surface px-3.5 py-3 text-[14.5px] font-medium outline-none placeholder:text-ink-3 focus:border-accent';

const labelClass = 'mb-2 block text-[13.5px] font-bold text-ink-2';

/** One of the three result tiles (Oylik / Jami / Ortiqcha). */
function ResultCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-[14px] border p-3.5',
        accent ? 'border-accent/40 bg-accent-soft' : 'border-line bg-card',
      )}
    >
      <p className="text-[12.5px] font-bold text-ink-3">{label}</p>
      <p
        className={cn(
          'mt-1 text-[16px] leading-tight font-extrabold tracking-tight',
          accent ? 'text-accent-dark' : 'text-ink',
        )}
      >
        {value}
      </p>
    </div>
  );
}

/**
 * Ipoteka (mortgage) calculator. Pure annuity math lives in `shared/lib/mortgage`;
 * this component owns the inputs, the bank-program picker, and the live output.
 * All figures are estimates — the disclaimer says so.
 */
export function MortgageCalculator({ initialPriceSom }: Props) {
  const { data: programs } = useMortgagePrograms();

  const [priceSom, setPriceSom] = useState(initialPriceSom ? Number(initialPriceSom) : 500_000_000);
  const [downMode, setDownMode] = useState<'som' | 'pct'>('pct');
  const [downValue, setDownValue] = useState(20);
  const [annualRatePct, setAnnualRatePct] = useState(18);
  const [termYears, setTermYears] = useState(20);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);

  function pickProgram(program: MortgageProgram) {
    setSelectedProgramId(program.id);
    setAnnualRatePct(program.rateBps / 100);
    // Clamp the term to what the program allows — never silently keep a longer one.
    setTermYears((y) => Math.min(y, Math.floor(program.maxTermMonths / 12)));
  }

  function selectCustom() {
    // "Boshqa" — free rate/term entry, no program constraints.
    setSelectedProgramId(null);
  }

  const downSom = downMode === 'pct' ? Math.round((priceSom * downValue) / 100) : downValue;
  const downPct = priceSom > 0 ? (downSom / priceSom) * 100 : 0;
  const downTooHigh = downSom >= priceSom;

  const selectedProgram = programs?.find((p) => p.id === selectedProgramId) ?? null;
  const minDownPct = selectedProgram ? selectedProgram.minDownBps / 100 : null;
  // Soft hint only — the buyer can still compute below the program's minimum.
  const belowMinDown = minDownPct != null && downPct < minDownPct;

  const result = computeMortgage({
    priceSom,
    downSom,
    annualRateBps: Math.round(annualRatePct * 100),
    termMonths: termYears * 12,
  });

  return (
    <div className="space-y-5">
      {/* Price */}
      <label className="block">
        <span className={labelClass}>Uy narxi, so'm</span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={priceSom || ''}
          onChange={(e) => setPriceSom(e.target.value ? Number(e.target.value) : 0)}
          placeholder="500 000 000"
          className={inputClass}
        />
      </label>

      {/* Down payment with a som/% toggle */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-[13.5px] font-bold text-ink-2">Boshlang'ich to'lov</span>
          <div className="flex overflow-hidden rounded-[10px] border border-line">
            {(['som', 'pct'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setDownMode(mode)}
                className={cn(
                  'px-3 py-1 text-[13px] font-bold transition-colors',
                  downMode === mode ? 'bg-accent-soft text-accent' : 'text-ink-3 hover:bg-surface',
                )}
              >
                {mode === 'som' ? "so'm" : '%'}
              </button>
            ))}
          </div>
        </div>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={downValue || ''}
          onChange={(e) => setDownValue(e.target.value ? Number(e.target.value) : 0)}
          placeholder={downMode === 'pct' ? '20' : '100 000 000'}
          className={inputClass}
        />
        <p className="mt-1.5 text-[12.5px] font-semibold text-ink-3">
          ≈ {formatPriceSom(String(downSom), 'SALE')} ({downPct.toFixed(0)}%)
        </p>
        {belowMinDown && (
          <p className="mt-1 text-[12.5px] font-semibold text-brand-amber">
            Bu dastur uchun eng kam boshlang'ich to'lov {minDownPct?.toFixed(0)}%
          </p>
        )}
      </div>

      {/* Bank program picker */}
      <div>
        <span className={labelClass}>Bank dasturi</span>
        <select
          value={selectedProgramId ?? 'custom'}
          onChange={(e) => {
            const program = programs?.find((p) => p.id === e.target.value);
            if (program) pickProgram(program);
            else selectCustom();
          }}
          className={inputClass}
        >
          <option value="custom">Boshqa (qo'lda kiritish)</option>
          {programs?.map((program) => (
            <option key={program.id} value={program.id}>
              {program.bankName} — {program.programName} ({(program.rateBps / 100).toFixed(0)}%)
            </option>
          ))}
        </select>
      </div>

      {/* Rate + term */}
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={labelClass}>Yillik stavka, %</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={0.1}
            value={annualRatePct || ''}
            onChange={(e) => {
              setAnnualRatePct(e.target.value ? Number(e.target.value) : 0);
              setSelectedProgramId(null);
            }}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Muddat, yil</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={termYears || ''}
            onChange={(e) => {
              setTermYears(e.target.value ? Number(e.target.value) : 1);
              setSelectedProgramId(null);
            }}
            className={inputClass}
          />
        </label>
      </div>

      {/* Output */}
      {downTooHigh ? (
        <p className="rounded-[14px] border border-brand-rose/30 bg-brand-rose/5 px-4 py-3 text-[13.5px] font-semibold text-brand-rose">
          Boshlang'ich to'lov narxdan kam bo'lishi kerak
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <ResultCard
            label="Oylik to'lov"
            value={formatPriceSom(String(result.monthlySom), 'SALE')}
            accent
          />
          <ResultCard label="Jami to'lov" value={formatPriceSom(String(result.totalSom), 'SALE')} />
          <ResultCard
            label="Ortiqcha to'lov"
            value={formatPriceSom(String(result.overpaymentSom), 'SALE')}
          />
        </div>
      )}

      <p className="text-[12.5px] leading-relaxed text-ink-3">
        Hisob taxminiy. Aniq shartlar bank tomonidan belgilanadi.
      </p>
    </div>
  );
}
