import { useState } from 'react';
import { useLeadAssist } from '../model/use-lead-assist';

/**
 * "AI yordam" for a claimed lead: a button that requests a next-step + a copyable
 * first-outreach draft, and renders the result inline. Takes only `leadId` as a prop
 * so it stays within the FSD `features → entities/shared` boundary (never imports
 * `@/features/*`); the leads page composes it beside the outcome stepper.
 */
export function LeadAssistPanel({ leadId }: { leadId: string }) {
  const { mutate, data, isPending } = useLeadAssist();
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
    <div className="mt-3 border-t border-line pt-3">
      <button
        type="button"
        onClick={() => mutate(leadId)}
        disabled={isPending}
        className="rounded-full bg-accent-soft px-3.5 py-1.5 text-[13px] font-bold text-accent-dark disabled:opacity-50"
      >
        {isPending ? 'Tayyorlanmoqda…' : '🤖 AI yordam'}
      </button>

      {data && (
        <div className="mt-3 rounded-[12px] bg-surface p-3.5">
          <p className="text-[13px] font-medium text-ink-2">
            <b className="font-bold text-ink">Keyingi qadam:</b> {data.nextAction}
          </p>
          <p className="mt-3 text-[13px] font-medium text-ink-2">
            <b className="font-bold text-ink">Mijozga xabar</b>
            {data.ai ? '' : ' (namuna)'}:
          </p>
          <textarea
            readOnly
            value={data.message}
            rows={4}
            className="mt-1.5 w-full resize-none rounded-[12px] border border-line bg-card px-3.5 py-2.5 text-[14px] font-medium text-ink outline-none"
          />
          <button
            type="button"
            onClick={() => copy(data.message)}
            className="mt-2 rounded-full bg-accent px-3.5 py-1.5 text-[13px] font-semibold text-white"
          >
            {copied ? 'Nusxa olindi' : 'Nusxa olish'}
          </button>
        </div>
      )}
    </div>
  );
}
