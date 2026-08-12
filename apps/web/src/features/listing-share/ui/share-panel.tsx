import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { buildShareCaption, type ShareCaptionListing } from '@rieltor/shared';
import { Icon } from '@/shared/ui/icon';
import { useShareLink } from '../model/use-share-link';

interface Props {
  open: boolean;
  onClose: () => void;
  listingId: string;
  listing: Omit<ShareCaptionListing, 'url'>;
}

/**
 * The "Ulashish" screen (design spec §8.1) — shown right after a fresh publish and
 * reachable again any time from the status bar or the cabinet list. Reuses the
 * LocationPicker's bottom-sheet-in-a-portal pattern (features/user-location) for a
 * consistent feel across the app's modals.
 */
export function SharePanel({ open, onClose, listingId, listing }: Props) {
  const share = useShareLink(listingId);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCopied(false);
    setCopyFailed(false);
    // Fires once per open — a re-open after a previous success just reuses
    // `share.data` instead of minting a second ShareLink for the same visit.
    // `share` itself (a fresh useMutation result every render) is deliberately left
    // out of the deps: this must run once per `open` flip, not once per render.
    if (!share.data) share.mutate(undefined);
  }, [open]);

  if (!open) return null;

  const caption = share.data ? buildShareCaption({ ...listing, url: share.data.url }) : null;

  async function copyCaption() {
    if (!caption) return;
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setCopyFailed(false);
    } catch {
      // Clipboard permission can be denied — the text is still selectable by hand.
      setCopyFailed(true);
    }
  }

  return createPortal(
    <div
      role="dialog"
      aria-label="Ulashish"
      className="fixed inset-0 z-[60] flex flex-col justify-end bg-ink/40"
    >
      <div className="flex max-h-[85vh] flex-col rounded-t-[20px] bg-card p-4">
        <div className="mb-3 flex shrink-0 items-center justify-between">
          <h2 className="text-[16px] font-extrabold">Ulashish</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Yopish"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink-2"
          >
            <Icon name="close" className="h-[18px] w-[18px]" strokeWidth={2.6} />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto">
          {share.isPending && (
            <p className="py-6 text-center text-[14px] font-semibold text-ink-3">
              Havola tayyorlanmoqda…
            </p>
          )}

          {share.isError && (
            <div className="py-4 text-center">
              <p className="text-[14px] font-semibold text-ink-2">Havolani yaratib bo'lmadi.</p>
              <button
                type="button"
                onClick={() => share.mutate(undefined)}
                className="mt-2 text-[13.5px] font-bold text-accent"
              >
                Qayta urinib ko'rish
              </button>
            </div>
          )}

          {share.data && caption && (
            <>
              <p className="mb-1 text-xs font-bold text-ink-3">Havola</p>
              <div className="rounded-[12px] border border-line bg-surface px-3 py-2.5 text-[13px] font-semibold break-all text-ink-2">
                {share.data.url}
              </div>

              <p className="mt-3 mb-1 text-xs font-bold text-ink-3">Tayyor caption</p>
              <div className="rounded-[12px] border border-line bg-surface px-3 py-2.5 text-[13.5px] whitespace-pre-wrap text-ink">
                {caption}
              </div>

              <button
                type="button"
                onClick={copyCaption}
                className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-[14px] bg-accent py-3.5 text-[15px] font-extrabold text-white"
              >
                <Icon
                  name={copied ? 'check' : 'doc'}
                  className="h-[17px] w-[17px]"
                  strokeWidth={2.4}
                />
                {copied ? 'Nusxalandi' : 'Nusxalash'}
              </button>
              {copyFailed && (
                <p className="mt-2 text-center text-[12.5px] font-bold text-red-600">
                  Nusxalab bo'lmadi — matnni qo'lda belgilab oling.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
