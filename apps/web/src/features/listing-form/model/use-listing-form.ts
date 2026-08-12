import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PublishableListingSchema,
  type Deal,
  type ListingInput,
  type ListingStatus,
  type ListingType,
  type OwnerListingDetail,
} from '@rieltor/shared';
import { changeStatus, deleteImage, updateListing, uploadImages, type UploadedImage } from '../api';

/** Every field is a plain string — controlled inputs stay simple, numbers are parsed
 *  only at the edges (toListingInput / computeMissing). */
export interface ListingFormState {
  title: string;
  deal: Deal;
  type: ListingType;
  priceSom: string;
  priceUsd: string;
  rooms: string;
  areaM2: string;
  floor: string;
  district: string;
  address: string;
  landmark: string;
  description: string;
}

/**
 * One listing image as the form tracks it. `id` is the DB image id, known only for
 * images uploaded or fetched-after-a-delete during THIS editing session — see the
 * doc comment on `deleteImage` in ../api.ts for why the initial GET cannot supply it.
 * null means "no delete affordance yet", not "this image has no id at all".
 */
export interface FormImage {
  base: string;
  ogUrl: string | null;
  width: number;
  height: number;
  position: number;
  id: string | null;
}

export function sanitizeDigits(raw: string): string {
  return raw.replace(/\D/g, '');
}

/** Keeps digits and at most one decimal point — good enough for an area in m². */
export function sanitizeDecimal(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, '');
  const firstDot = cleaned.indexOf('.');
  if (firstDot === -1) return cleaned;
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
}

function seedImages(listing: OwnerListingDetail): FormImage[] {
  return listing.images.map((image) => ({ ...image, id: null }));
}

/** Backend DRAFT defaults are empty/zero placeholders (listings-write.service.ts) —
 *  shown as blank inputs rather than a literal "0" that looks like a real answer. */
function toFormState(listing: OwnerListingDetail): ListingFormState {
  return {
    title: listing.title,
    deal: listing.deal,
    type: listing.type,
    priceSom: listing.priceSom === '0' ? '' : listing.priceSom,
    priceUsd: listing.priceUsd === 0 ? '' : String(listing.priceUsd),
    rooms: listing.rooms === null ? '' : String(listing.rooms),
    areaM2: listing.areaM2 === 0 ? '' : String(listing.areaM2),
    floor: listing.floor ?? '',
    district: listing.district,
    address: listing.address,
    landmark: listing.landmark,
    description: listing.description,
  };
}

function parsePositiveInt(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const n = Math.trunc(Number(trimmed));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parsePositiveNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Commercial premises are not measured in rooms (§7.4) — the field is force-cleared. */
function deriveRooms(form: ListingFormState): number | null {
  if (form.type === 'COMMERCIAL') return null;
  return parsePositiveInt(form.rooms);
}

/**
 * Maps the form onto the PATCH body. A field that cannot yet pass ListingInputSchema
 * on its own (e.g. an empty priceSom, which the schema's regex rejects outright) is
 * omitted rather than sent, so a half-filled DRAFT can still be saved one field at a
 * time without a 400 from fields nobody has touched yet.
 */
export function toListingInput(form: ListingFormState): ListingInput {
  const input: ListingInput = {
    title: form.title,
    deal: form.deal,
    type: form.type,
    district: form.district,
    address: form.address,
    landmark: form.landmark,
    description: form.description,
    floor: form.floor.trim() === '' ? null : form.floor.trim(),
    rooms: deriveRooms(form),
  };

  const priceSom = form.priceSom.trim();
  if (priceSom !== '') input.priceSom = priceSom;

  const priceUsd = parsePositiveInt(form.priceUsd);
  if (priceUsd !== null) input.priceUsd = priceUsd;

  const areaM2 = parsePositiveNumber(form.areaM2);
  if (areaM2 !== null) input.areaM2 = areaM2;

  return input;
}

/** Uzbek label per PublishableListingSchema field — the schema decides WHICH fields
 *  are missing, this decides how to say it (its own default zod messages are not all
 *  in Uzbek, so they are never shown directly). */
const FIELD_LABEL: Record<string, string> = {
  title: 'Sarlavha (kamida 10 belgi)',
  priceSom: "Narx (so'm)",
  priceUsd: 'Narx ($)',
  areaM2: 'Maydon (m²)',
  district: 'Tuman',
  type: 'Obyekt turi',
  deal: 'Amal turi',
  rooms: 'Xonalar soni',
};

/**
 * "What's still missing to publish" — the same rule set as the server's publish()
 * step (PublishableListingSchema + ≥1 image + realtor.phone), so a listing the front
 * calls ready is never rejected by the back for a reason the user was not shown.
 */
function computeMissing(form: ListingFormState, imageCount: number, hasPhone: boolean): string[] {
  const parsed = PublishableListingSchema.safeParse({
    title: form.title,
    priceSom: form.priceSom.trim(),
    priceUsd: parsePositiveInt(form.priceUsd) ?? -1,
    areaM2: parsePositiveNumber(form.areaM2) ?? -1,
    district: form.district,
    type: form.type,
    deal: form.deal,
    rooms: deriveRooms(form),
  });

  const missing: string[] = [];
  if (!parsed.success) {
    const seen = new Set<string>();
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? '');
      if (!key || seen.has(key)) continue;
      seen.add(key);
      missing.push(FIELD_LABEL[key] ?? key);
    }
  }
  if (imageCount < 1) missing.push('Kamida 1 ta rasm');
  if (!hasPhone) missing.push('Profilda telefon raqami');
  return missing;
}

export interface UseListingFormParams {
  listingId: string;
  initial: OwnerListingDetail;
  /** From the realtor's own profile (features/auth) — threaded in as a prop rather
   *  than imported, because a feature may not import another feature (FSD boundary). */
  hasPhone: boolean;
}

export function useListingForm({ listingId, initial, hasPhone }: UseListingFormParams) {
  const queryClient = useQueryClient();

  const [form, setForm] = useState<ListingFormState>(() => toFormState(initial));
  const [images, setImages] = useState<FormImage[]>(() => seedImages(initial));
  // Guards re-seeding to only the moment `listingId` itself changes — a background
  // refetch of `initial` must never clobber edits the user has not saved yet.
  const seededFor = useRef(listingId);

  useEffect(() => {
    if (seededFor.current === listingId) return;
    seededFor.current = listingId;
    setForm(toFormState(initial));
    setImages(seedImages(initial));
    // `initial` is deliberately left out of the deps: re-seeding must fire only on a
    // listingId change, not on every background refetch of `initial`.
  }, [listingId]);

  function setField<K extends keyof ListingFormState>(key: K, value: ListingFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const missing = useMemo(
    () => computeMissing(form, images.length, hasPhone),
    [form, images.length, hasPhone],
  );

  function invalidateList() {
    void queryClient.invalidateQueries({ queryKey: ['myListings'] });
  }

  const save = useMutation({
    mutationFn: () => updateListing(listingId, toListingInput(form)),
    onSuccess: invalidateList,
  });

  const transition = useMutation({
    mutationFn: (to: ListingStatus) => changeStatus(listingId, to),
    onSuccess: (result) => {
      // Patched directly instead of invalidated: a refetch would re-fetch `images`
      // through the id-less public shape and erase everything upload/delete learned.
      queryClient.setQueryData(['myListing', listingId], (old: OwnerListingDetail | undefined) =>
        old ? { ...old, status: result.status } : old,
      );
      invalidateList();
    },
  });

  const upload = useMutation({
    mutationFn: (files: File[]) => uploadImages(listingId, files),
    onSuccess: (created: UploadedImage[]) => {
      setImages((prev) => [...prev, ...created]);
      invalidateList();
    },
  });

  const removeImage = useMutation({
    mutationFn: (imageId: string) => deleteImage(listingId, imageId),
    // The response is the listing's full remaining set (with ids), so this also
    // upgrades any still id-less pre-existing images to deletable from here on.
    onSuccess: (remaining: UploadedImage[]) => {
      setImages(remaining);
      invalidateList();
    },
  });

  return { form, setField, images, missing, save, transition, upload, removeImage };
}
