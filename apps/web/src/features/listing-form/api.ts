import { queryOptions } from '@tanstack/react-query';
import {
  ImageSchema,
  ListingStatusSchema,
  OwnerListingDetailSchema,
  OwnerListingSummarySchema,
  type ListingInput,
  type ListingStatus,
  type OwnerListingDetail,
  type OwnerListingSummary,
} from '@rieltor/shared';
import * as z from 'zod';
import { apiDelete, apiGet, apiPatch, apiPost, apiUpload } from '@/shared/api/client';

const IdResultSchema = z.object({ id: z.string() });
const StatusResultSchema = z.object({ status: ListingStatusSchema });

/**
 * The owner-only media endpoints hand back the raw stored row, which — unlike the
 * public ImageSchema — includes the database id. It is extended here, not in
 * @rieltor/shared, because only this feature's delete-by-id flow needs it; parsing
 * the response through the plain ImageSchema would silently strip the field.
 */
const UploadedImageSchema = ImageSchema.extend({ id: z.string() });
export type UploadedImage = z.infer<typeof UploadedImageSchema>;

export const myListingsQuery = () =>
  queryOptions({
    queryKey: ['myListings'] as const,
    queryFn: (): Promise<OwnerListingSummary[]> =>
      apiGet('/api/me/objects', z.array(OwnerListingSummarySchema)),
  });

export const myListingQuery = (id: string) =>
  queryOptions({
    queryKey: ['myListing', id] as const,
    queryFn: (): Promise<OwnerListingDetail> =>
      apiGet(`/api/me/objects/${id}`, OwnerListingDetailSchema),
    // A 404/403 (wrong owner, bad id) will not fix itself on retry.
    retry: false,
  });

export function createDraft(input: ListingInput): Promise<{ id: string }> {
  return apiPost('/api/objects', IdResultSchema, input);
}

export function updateListing(id: string, input: ListingInput): Promise<{ id: string }> {
  return apiPatch(`/api/objects/${id}`, IdResultSchema, input);
}

export function changeStatus(id: string, to: ListingStatus): Promise<{ status: ListingStatus }> {
  return apiPost(`/api/objects/${id}/status`, StatusResultSchema, { to });
}

export function uploadImages(id: string, files: File[]): Promise<UploadedImage[]> {
  const formData = new FormData();
  // The API's FilesInterceptor reads the 'images' field.
  for (const file of files) formData.append('images', file);
  return apiUpload(`/api/objects/${id}/images`, z.array(UploadedImageSchema), formData);
}

/** Returns the listing's full remaining image set (with ids), not just the removed one. */
export function deleteImage(id: string, imageId: string): Promise<UploadedImage[]> {
  return apiDelete(`/api/objects/${id}/images/${imageId}`, z.array(UploadedImageSchema));
}

/** Permanently deletes the whole listing. */
export function deleteListing(id: string): Promise<{ id: string }> {
  return apiDelete(`/api/objects/${id}`, IdResultSchema);
}
