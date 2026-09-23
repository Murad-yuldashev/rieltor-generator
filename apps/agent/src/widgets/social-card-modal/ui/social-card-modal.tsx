import { useEffect, useRef, useState } from 'react';
import type { RealtorOwnListing } from '@rieltor/shared';
import {
  SocialCard,
  useListingContent,
  type CardFormat,
  type SocialCardHandle,
} from '@/features/social-content';
import { useProfile } from '@/features/profile';
import { useSession } from '@/entities/session';
import { telegramShareUrl } from '@/features/presentations';

export function SocialCardModal({
  listing,
  onClose,
}: {
  listing: RealtorOwnListing;
  onClose: () => void;
}) {
  const { data: profile } = useProfile();
  const { user } = useSession();
  // Per-listing query (fires on mount, deduped + cached — no useEffect, no double-POST).
  const { data: content, isPending, isError } = useListingContent(listing.id, true);
  const cardRef = useRef<SocialCardHandle>(null);
  const [format, setFormat] = useState<CardFormat>('story');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const captionBlock = content ? `${content.caption}\n\n${content.hashtags}` : '';
  const shareUrl = content?.shareUrl ?? '';
  const filename = `${profile?.slug ? `${profile.slug}-` : ''}${listing.id}-${format}.png`;

  const copyCaption = () => {
    if (!captionBlock) return;
    void navigator.clipboard
      ?.writeText(captionBlock)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => undefined);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="social-card-modal-title"
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-card bg-card p-4 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <p id="social-card-modal-title" className="text-[15px] font-extrabold text-ink">
            Kontent yaratish
          </p>
          <button type="button" onClick={onClose} className="text-[13px] font-bold text-ink-3">
            Yopish
          </button>
        </div>

        <div className="mb-3 flex gap-2">
          {(['story', 'post'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              className={
                format === f
                  ? 'rounded-[12px] bg-accent px-4 py-2 text-[13px] font-extrabold text-white'
                  : 'rounded-[12px] border border-line px-4 py-2 text-[13px] font-bold text-ink-2'
              }
            >
              {f === 'story' ? 'Story' : 'Post'}
            </button>
          ))}
        </div>

        <SocialCard
          ref={cardRef}
          listing={listing}
          format={format}
          agency={profile?.agency ?? ''}
          realtorName={user?.name ?? null}
          logoUrl={profile?.logoUrl ?? null}
          brandColor={profile?.brandColor ?? null}
          shareUrl={shareUrl}
        />

        <button
          type="button"
          onClick={() => cardRef.current?.download(filename)}
          className="mt-3 w-full rounded-[14px] bg-accent px-5 py-3 text-[14.5px] font-extrabold text-white"
        >
          Rasmni yuklab olish
        </button>

        <div className="mt-4">
          {isPending && <p className="text-[13px] text-ink-3">Matn tayyorlanmoqda…</p>}
          {isError && (
            <p className="text-[13px] font-semibold text-brand-rose">Matnni yuklab bo'lmadi.</p>
          )}
          {content && (
            <>
              <textarea
                readOnly
                value={captionBlock}
                rows={6}
                className="w-full resize-none rounded-[12px] border border-line bg-surface p-3 text-[13.5px]"
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={copyCaption}
                  className="flex-1 rounded-[12px] border border-line px-4 py-2.5 text-[13px] font-bold text-ink-2"
                >
                  {copied ? 'Nusxalandi' : 'Matnni nusxalash'}
                </button>
                <a
                  href={telegramShareUrl(shareUrl, captionBlock)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-[12px] bg-accent px-4 py-2.5 text-center text-[13px] font-extrabold text-white"
                >
                  Telegram'da ulash
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
