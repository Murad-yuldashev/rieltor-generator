import { useState } from 'react';
import { type AiContentRequest, type ListingSummary } from '@rieltor/shared';
import { useListingContent } from '../model/use-listing-content';

export function ListingContentButton({ listing }: { listing: ListingSummary }) {
  const { mutate, data, isPending } = useListingContent();
  const [copied, setCopied] = useState(false);

  const req: AiContentRequest = {
    type: listing.type,
    deal: listing.deal,
    district: listing.district,
    rooms: listing.rooms,
    areaM2: listing.areaM2,
    priceSom: listing.priceSom,
  };

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
    <div className="mt-2">
      <button
        type="button"
        onClick={() => mutate(req)}
        disabled={isPending}
        className="inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-line bg-surface px-3.5 py-2 text-[13px] font-bold text-ink-2 disabled:opacity-60"
      >
        {isPending ? 'Tayyorlanmoqda…' : '📣 AI post'}
      </button>
      {data && (
        <div className="mt-3 flex flex-col gap-2 rounded-card bg-surface p-3">
          <p className="text-[13px] font-bold text-ink">Post{data.ai ? '' : ' (namuna)'}:</p>
          <textarea
            readOnly
            aria-label="Post matni"
            value={data.caption}
            rows={4}
            className="w-full resize-none rounded-[10px] border border-line bg-card px-3 py-2 text-[13px] font-medium text-ink outline-none"
          />
          <textarea
            readOnly
            aria-label="Hashtag'lar"
            value={data.hashtags}
            rows={2}
            className="w-full resize-none rounded-[10px] border border-line bg-card px-3 py-2 text-[13px] font-medium text-ink outline-none"
          />
          <button
            type="button"
            onClick={() => copy(`${data.caption}\n\n${data.hashtags}`)}
            className="inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-accent px-3.5 py-2 text-[13px] font-bold text-white"
          >
            {copied ? 'Nusxa olindi' : 'Nusxa olish'}
          </button>
        </div>
      )}
    </div>
  );
}
