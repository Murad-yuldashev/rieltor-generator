import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';
import { ResponsiveImage } from '@/shared/ui/responsive-image';
import type { ListingDraftState } from '../../model/use-listing-draft';
import { WizardNav } from '../wizard-nav';

const MAX_IMAGES = 10;

interface Props {
  draft: ListingDraftState;
}

/** Step 4: photo upload. Drag/drop or file picker, thumbnails from the upload response, delete, capped at 10. */
export function PhotosStep({ draft }: Props) {
  const { images, uploadImage, deleteImage, next, back, isSaving } = draft;

  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const remaining = MAX_IMAGES - images.length;
  const canContinue = images.length > 0;

  async function handleFiles(files: FileList) {
    setError(null);
    const list = Array.from(files).slice(0, remaining);
    if (list.length === 0) {
      setError(`Ko'pi bilan ${MAX_IMAGES} ta rasm yuklash mumkin`);
      return;
    }

    setIsUploading(true);
    try {
      // Sequential on purpose: the API assigns `position` from the current image
      // count per request, so uploading in parallel would race on that count.
      for (const file of list) {
        await uploadImage(file);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rasmni yuklab bo'lmadi");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(imageId: string) {
    setDeletingId(imageId);
    setError(null);
    try {
      await deleteImage(imageId);
    } catch {
      setError("Rasmni o'chirib bo'lmadi. Qaytadan urinib ko'ring.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files.length > 0) void handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-[16px] border-2 border-dashed px-4 py-8 text-center transition-colors',
          isDragging ? 'border-accent bg-accent-soft' : 'border-line bg-surface',
          remaining <= 0 && 'pointer-events-none opacity-50',
        )}
      >
        <Icon name="camera" className="h-7 w-7 text-accent" strokeWidth={1.8} />
        <p className="text-[14px] font-bold text-ink">Rasmlarni shu yerga tashlang</p>
        <p className="text-[12.5px] text-ink-3">yoki fayl tanlash uchun bosing — JPEG, PNG, WebP</p>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={remaining <= 0 || isUploading}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) void handleFiles(e.target.files);
            e.target.value = '';
          }}
          className="hidden"
        />
      </label>

      {isUploading && <p className="mt-2 text-[13px] font-semibold text-ink-2">Yuklanmoqda...</p>}
      {error && <p className="mt-2 text-[13px] font-semibold text-brand-rose">{error}</p>}

      <p className="mt-3 text-[12.5px] text-ink-3">
        {images.length} / {MAX_IMAGES} rasm
      </p>

      {images.length > 0 && (
        <ul className="mt-3 grid grid-cols-3 gap-2.5 desk:grid-cols-4">
          {images.map((image, i) => (
            <li
              key={image.id}
              className="relative aspect-square overflow-hidden rounded-[12px] bg-surface"
            >
              <ResponsiveImage image={image} alt={`Rasm ${i + 1}`} className="h-full w-full" />
              <button
                type="button"
                aria-label="Rasmni o'chirish"
                onClick={() => handleDelete(image.id)}
                disabled={deletingId === image.id}
                className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink/60 text-white disabled:opacity-50"
              >
                <Icon name="close" className="h-3.5 w-3.5" strokeWidth={2.4} />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1.5 left-1.5 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">
                  Asosiy
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <WizardNav
        onBack={back}
        onNext={next}
        nextLabel="Davom etish"
        nextDisabled={!canContinue}
        isBusy={isSaving}
      />
    </div>
  );
}
