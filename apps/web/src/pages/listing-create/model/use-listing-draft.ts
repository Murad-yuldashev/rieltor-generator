import { useCallback, useEffect, useRef, useState } from 'react';
import * as z from 'zod';
import { ListingDraftSchema, type Image, type ListingDraft } from '@rieltor/shared';
import { apiDelete, apiPatch, apiPost, apiUpload, ApiError } from '@/shared/api/client';

export const STEP_COUNT = 6;

const CreatedDraftSchema = z.object({ id: z.string() });

/**
 * What `POST /api/my/listings/:id/images` returns. Not the public `Image`
 * shape — no `ogUrl`, but an `id`, because the wizard needs a handle for
 * `DELETE /api/my/listings/:id/images/:imageId` that the public shape has no
 * use for.
 */
const UploadedImageSchema = z.object({
  id: z.string(),
  base: z.string(),
  position: z.number().int(),
  width: z.number().int(),
  height: z.number().int(),
});

export interface DraftImage extends Image {
  id: string;
}

function toDraftImage(uploaded: z.infer<typeof UploadedImageSchema>): DraftImage {
  // `ResponsiveImage` reads `ogUrl` off the type but never renders it — the
  // upload response has no crop to offer, so `null` is exactly correct, not a stand-in.
  return { ...uploaded, ogUrl: null };
}

/**
 * Multipart upload — deliberately NOT going through `apiPost` (JSON-only).
 * `apiUpload` sends the `FormData` body itself (no `content-type` override, so
 * the browser fills in the multipart boundary) but shares the same bearer-token
 * attach and refresh-once-on-401 retry as every other call — a long photo
 * session outlasting the 15-minute access token no longer 401s on upload while
 * every other step self-heals.
 */
async function uploadDraftImage(draftId: string, file: File): Promise<DraftImage> {
  const formData = new FormData();
  formData.append('file', file);

  const uploaded = await apiUpload(
    `/api/my/listings/${draftId}/images`,
    formData,
    UploadedImageSchema,
  );
  return toDraftImage(uploaded);
}

/**
 * Drives the six-step wizard end to end:
 * - creates the draft once, on mount;
 * - keeps every field the steps have collected so far in `fields`, merged in
 *   by `patch()` as the user types — no network call yet;
 * - `next()` PATCHes the accumulated `fields` to the draft and only then
 *   advances `step`, so a crash mid-wizard loses at most the step in progress;
 * - the photo step gets its own pair of calls, since images are persisted
 *   immediately on upload rather than accumulated locally like the other fields.
 */
export function useListingDraft() {
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(true);
  const [createError, setCreateError] = useState<string | null>(null);

  const [step, setStep] = useState(0);
  const [fields, setFields] = useState<ListingDraft>({});
  const [isSaving, setIsSaving] = useState(false);

  const [images, setImages] = useState<DraftImage[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // StrictMode double-invokes effects in dev — without this guard a fresh mount
  // would fire two POSTs and silently orphan the first draft.
  const hasStartedCreate = useRef(false);

  useEffect(() => {
    if (hasStartedCreate.current) return;
    hasStartedCreate.current = true;

    apiPost('/api/my/listings', CreatedDraftSchema)
      .then((draft) => setDraftId(draft.id))
      .catch(() => setCreateError("E'lon loyihasini boshlab bo'lmadi. Sahifani qayta yuklang."))
      .finally(() => setIsCreating(false));
  }, []);

  const patch = useCallback((next: Partial<ListingDraft>) => {
    setFields((prev) => ({ ...prev, ...next }));
  }, []);

  const next = useCallback(async () => {
    if (!draftId) return;

    setIsSaving(true);
    try {
      await apiPatch(`/api/my/listings/${draftId}`, undefined, ListingDraftSchema.parse(fields));
      setStep((s) => Math.min(s + 1, STEP_COUNT - 1));
    } finally {
      setIsSaving(false);
    }
  }, [draftId, fields]);

  const back = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);

  const uploadImage = useCallback(
    async (file: File) => {
      if (!draftId) throw new Error("Loyiha hali tayyor emas, birozdan so'ng urinib ko'ring");
      const image = await uploadDraftImage(draftId, file);
      setImages((prev) => [...prev, image].sort((a, b) => a.position - b.position));
    },
    [draftId],
  );

  const deleteImage = useCallback(
    async (imageId: string) => {
      if (!draftId) return;
      await apiDelete(`/api/my/listings/${draftId}/images/${imageId}`);
      setImages((prev) => prev.filter((image) => image.id !== imageId));
    },
    [draftId],
  );

  const submit = useCallback(async () => {
    if (!draftId) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      // The accumulated fields might not have made it to the server yet if the
      // user reached this step without the last `next()` running (e.g. typed
      // straight into the last field) — one more PATCH before submit closes that gap.
      await apiPatch(`/api/my/listings/${draftId}`, undefined, ListingDraftSchema.parse(fields));
      await apiPost(`/api/my/listings/${draftId}/submit`);
      setIsSubmitted(true);
    } catch (error) {
      setSubmitError(
        error instanceof ApiError ? error.message : "Xatolik yuz berdi. Qaytadan urinib ko'ring.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [draftId, fields]);

  return {
    draftId,
    isCreating,
    createError,
    fields,
    patch,
    step,
    next,
    back,
    isSaving,
    images,
    uploadImage,
    deleteImage,
    submit,
    isSubmitting,
    submitError,
    isSubmitted,
  };
}

export type ListingDraftState = ReturnType<typeof useListingDraft>;
