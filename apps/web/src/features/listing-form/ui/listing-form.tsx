import { useState, type ReactNode } from 'react';
import { formatPriceSom, type Deal, type OwnerListingDetail } from '@rieltor/shared';
import { useTranslation } from 'react-i18next';
import { LISTING_TYPE_META, LISTING_TYPES } from '@/entities/listing';
import { SharePanel } from '@/features/listing-share';
import { ApiError } from '@/shared/api/client';
import { cn } from '@/shared/lib/cn';
import { SectionCard } from '@/shared/ui/section-card';
import { sanitizeDecimal, sanitizeDigits, useListingForm } from '../model/use-listing-form';
import { ImageGrid } from './image-grid';
import { StatusBar } from './status-bar';

interface Props {
  listingId: string;
  initial: OwnerListingDetail;
  /** Whether the realtor's own profile already has a phone — threaded in from the
   *  page (features/auth), since a feature may not import another feature. */
  hasPhone: boolean;
}

const INPUT_CLASS =
  'w-full rounded-[12px] border border-line bg-card px-3 py-2.5 text-[15px] font-semibold';

/** labelKey, not display text — module scope has no useTranslation(), same pattern
 *  as bottom-nav's NAV_TABS. */
const DEALS: { value: Deal; labelKey: string }[] = [
  { value: 'SALE', labelKey: 'deal.sale' },
  { value: 'RENT', labelKey: 'deal.rent' },
];

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn('block py-2', className)}>
      <span className="mb-1 block text-xs font-bold text-ink-3">{label}</span>
      {children}
    </label>
  );
}

function uploadErrorMessage(error: unknown, t: (key: string) => string): string {
  if (error instanceof ApiError) {
    if (error.status === 413) return t('uploadErrorTooLarge');
    if (error.status === 422) return t('uploadErrorInvalid');
  }
  return t('uploadErrorGeneric');
}

export function ListingForm({ listingId, initial, hasPhone }: Props) {
  const { t } = useTranslation('cabinet');
  const { form, setField, images, missing, save, transition, upload, removeImage } = useListingForm(
    { listingId, initial, hasPhone },
  );
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <div className="px-4 pb-10">
      <StatusBar
        listingId={listingId}
        status={initial.status}
        missing={missing}
        hasPhone={hasPhone}
        save={save}
        transition={transition}
        onShare={() => setShareOpen(true)}
      />

      <SectionCard className="mt-3" title={t('section.basicInfo')}>
        <Field label={t('field.title')}>
          <input
            value={form.title}
            onChange={(event) => setField('title', event.target.value)}
            maxLength={120}
            placeholder={t('field.titlePlaceholder')}
            className={INPUT_CLASS}
          />
        </Field>

        <div
          role="tablist"
          aria-label={t('field.deal')}
          className="mt-1 flex rounded-xl bg-[#e8e8ee] p-1"
        >
          {DEALS.map(({ value, labelKey }) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={form.deal === value}
              onClick={() => setField('deal', value)}
              className={cn(
                'flex-1 rounded-[9px] py-2.5 text-sm font-bold transition-colors',
                form.deal === value ? 'bg-white text-ink shadow-sm' : 'text-ink-2',
              )}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>

        <div
          role="tablist"
          aria-label={t('field.type')}
          className="no-scrollbar mt-2.5 flex gap-2 overflow-x-auto pb-1"
        >
          {LISTING_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              role="tab"
              aria-selected={form.type === type}
              onClick={() => setField('type', type)}
              className={cn(
                'shrink-0 rounded-full border px-[15px] py-2.5 text-[13.5px] font-semibold transition-colors',
                form.type === type
                  ? 'border-accent bg-accent text-white shadow-lg shadow-accent/30'
                  : 'border-line bg-card text-ink-2',
              )}
            >
              {LISTING_TYPE_META[type].chipLabel}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard className="mt-3" title={t('section.price')}>
        <div className="flex gap-3">
          <Field label={t('field.priceSom')} className="flex-1">
            <input
              value={form.priceSom}
              onChange={(event) => setField('priceSom', sanitizeDigits(event.target.value))}
              inputMode="numeric"
              placeholder={t('field.priceSomPlaceholder')}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label={t('field.priceUsd')} className="flex-1">
            <input
              value={form.priceUsd}
              onChange={(event) => setField('priceUsd', sanitizeDigits(event.target.value))}
              inputMode="numeric"
              placeholder={t('field.priceUsdPlaceholder')}
              className={INPUT_CLASS}
            />
          </Field>
        </div>
        {form.priceSom && (
          <p className="mt-1.5 text-xs font-semibold text-ink-3">
            {formatPriceSom(form.priceSom, form.deal)}
          </p>
        )}
      </SectionCard>

      <SectionCard className="mt-3" title={t('section.params')}>
        <div
          className={cn('grid gap-2', form.type === 'COMMERCIAL' ? 'grid-cols-2' : 'grid-cols-3')}
        >
          {/* Commercial premises are not measured in rooms (§7.4) — the field drops out. */}
          {form.type !== 'COMMERCIAL' && (
            <Field label={t('field.rooms')}>
              <input
                value={form.rooms}
                onChange={(event) => setField('rooms', sanitizeDigits(event.target.value))}
                inputMode="numeric"
                placeholder={t('field.roomsPlaceholder')}
                className={INPUT_CLASS}
              />
            </Field>
          )}
          <Field label={t('field.areaM2')}>
            <input
              value={form.areaM2}
              onChange={(event) => setField('areaM2', sanitizeDecimal(event.target.value))}
              inputMode="decimal"
              placeholder={t('field.areaM2Placeholder')}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label={t('field.floor')}>
            <input
              value={form.floor}
              onChange={(event) => setField('floor', event.target.value)}
              placeholder={t('field.floorPlaceholder')}
              maxLength={20}
              className={INPUT_CLASS}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard className="mt-3" title={t('section.addressGroup')}>
        <Field label={t('field.district')}>
          <input
            value={form.district}
            onChange={(event) => setField('district', event.target.value)}
            placeholder={t('field.districtPlaceholder')}
            maxLength={60}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label={t('field.address')}>
          <input
            value={form.address}
            onChange={(event) => setField('address', event.target.value)}
            placeholder={t('field.addressPlaceholder')}
            maxLength={200}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label={t('field.landmark')}>
          <input
            value={form.landmark}
            onChange={(event) => setField('landmark', event.target.value)}
            placeholder={t('field.landmarkPlaceholder')}
            maxLength={120}
            className={INPUT_CLASS}
          />
        </Field>
      </SectionCard>

      <SectionCard className="mt-3" title={t('section.description')}>
        <textarea
          value={form.description}
          onChange={(event) => setField('description', event.target.value)}
          maxLength={4000}
          rows={5}
          placeholder={t('field.descriptionPlaceholder')}
          className={cn(INPUT_CLASS, 'min-h-[110px] resize-y')}
        />
      </SectionCard>

      <SectionCard className="mt-3" title={t('section.images')}>
        <ImageGrid
          images={images}
          onUpload={(files) => upload.mutate(files)}
          uploading={upload.isPending}
          uploadError={upload.isError ? uploadErrorMessage(upload.error, t) : null}
          onDelete={(imageId) => removeImage.mutate(imageId)}
          deleting={removeImage.isPending}
        />
      </SectionCard>

      {/* Opened right after a fresh DRAFT→ACTIVE publish (StatusBar's onShare) and
          reachable again any time via its "Ulashish" button — see status-bar.tsx. */}
      <SharePanel
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        listingId={listingId}
        listing={initial}
      />
    </div>
  );
}
