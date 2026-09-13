import { useState } from 'react';
import { useFinanceInsight } from '../model/use-finance-insight';

/** "AI tahlil" — an on-demand narrative over the finance snapshot, shown under the Moliya cards. */
export function FinanceInsight() {
  const { mutate, data, isPending } = useFinanceInsight();
  const [copied, setCopied] = useState(false);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (insecure context / denied) — the text is still visible to select.
    }
  }

  return (
    <section className="rounded-card bg-card p-4 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-ink-3">AI tahlil</h2>
        <button
          type="button"
          onClick={() => mutate()}
          disabled={isPending}
          className="inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-line bg-surface px-3.5 py-2 text-[13px] font-bold text-ink-2 disabled:opacity-60"
        >
          {isPending ? (
            'Tayyorlanmoqda…'
          ) : (
            <>
              <span aria-hidden="true">✨</span> Tahlil qilish
            </>
          )}
        </button>
      </div>
      {data && (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-[12px] font-semibold text-ink-3">
            {data.ai ? 'AI tahlil' : 'Namuna tahlil'}
          </p>
          <textarea
            readOnly
            aria-label="AI moliyaviy tahlil"
            value={data.insight}
            rows={5}
            className="w-full resize-none rounded-[10px] border border-line bg-surface px-3 py-2 text-[13px] font-medium leading-relaxed text-ink outline-none"
          />
          <button
            type="button"
            onClick={() => copy(data.insight)}
            className="inline-flex items-center justify-center gap-1.5 self-start rounded-[10px] bg-accent px-3.5 py-2 text-[13px] font-bold text-white"
          >
            {copied ? 'Nusxa olindi' : 'Nusxa olish'}
          </button>
        </div>
      )}
    </section>
  );
}
