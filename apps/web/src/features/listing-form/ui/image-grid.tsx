import { type ChangeEvent, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';
import { ResponsiveImage } from '@/shared/ui/responsive-image';
import type { FormImage } from '../model/use-listing-form';

/** Mirrors MAX_IMAGES_PER_LISTING in apps/api/src/media/media.service.ts — duplicated
 *  as a client-side guard so a hopeless over-the-limit upload never leaves the browser. */
const MAX_IMAGES = 12;

interface Props {
  images: FormImage[];
  onUpload: (files: File[]) => void;
  uploading: boolean;
  uploadError: string | null;
  onDelete: (imageId: string) => void;
  deleting: boolean;
}

export function ImageGrid({ images, onUpload, uploading, uploadError, onDelete, deleting }: Props) {
  const { t } = useTranslation('cabinet');
  const inputRef = useRef<HTMLInputElement>(null);
  const remaining = MAX_IMAGES - images.length;
  // Pre-existing images loaded without a known id (see FormImage's doc comment) have
  // no delete button — this note explains the gap instead of leaving it unexplained.
  const hasUndeletable = images.some((image) => image.id === null);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    // Clearing the input lets the same file be re-picked after a failed upload.
    event.target.value = '';
    if (files.length > 0) onUpload(files.slice(0, Math.max(remaining, 0)));
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {images.map((image, index) => {
          const imageId = image.id;
          return (
            <div
              key={`${image.base}-${index}`}
              className="relative aspect-square overflow-hidden rounded-xl bg-line"
            >
              <ResponsiveImage image={image} alt="" className="h-full w-full" />

              {index === 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-ink/60 px-1.5 py-0.5 text-[9px] font-extrabold text-white backdrop-blur-sm">
                  {t('image.coverBadge')}
                </span>
              )}

              {imageId && (
                <button
                  type="button"
                  onClick={() => onDelete(imageId)}
                  disabled={deleting}
                  aria-label={t('image.deleteAria')}
                  className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/60 text-white backdrop-blur-sm disabled:opacity-50"
                >
                  <Icon name="close" className="h-3.5 w-3.5" strokeWidth={2.6} />
                </button>
              )}
            </div>
          );
        })}

        {remaining > 0 && (
          <label
            className={cn(
              'flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line text-ink-3',
              uploading ? 'opacity-60' : 'cursor-pointer',
            )}
          >
            <Icon name="camera" className="h-5 w-5" strokeWidth={2} />
            <span className="text-[11px] font-bold">
              {uploading ? t('common:loading') : t('image.addLabel')}
            </span>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={uploading}
              onChange={handleChange}
              className="sr-only"
            />
          </label>
        )}
      </div>

      <p className="mt-2 text-[12px] font-semibold text-ink-3">
        {t('image.formatHint', { max: MAX_IMAGES })}
        {remaining > 0 && ` · ${t('image.remainingCount', { count: remaining })}`}
      </p>

      {uploadError && <p className="mt-1.5 text-[13px] font-bold text-red-600">{uploadError}</p>}

      {hasUndeletable && (
        <p className="mt-1.5 text-[12px] font-semibold text-ink-3">
          {t('image.cannotDeleteExisting')}
        </p>
      )}
    </div>
  );
}
