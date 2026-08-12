import { useState, type ReactNode } from 'react';
import { formatPriceSom, type Deal, type OwnerListingDetail } from '@rieltor/shared';
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

const DEALS: { value: Deal; label: string }[] = [
  { value: 'SALE', label: 'Sotish' },
  { value: 'RENT', label: 'Ijaraga berish' },
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

function uploadErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 413) return 'Rasmlar hajmi juda katta (4 MB dan oshmasin).';
    if (error.status === 422) return "Rasmlarni yuklab bo'lmadi — format yoki soni noto'g'ri.";
  }
  return 'Yuklashda xatolik yuz berdi.';
}

export function ListingForm({ listingId, initial, hasPhone }: Props) {
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

      <SectionCard className="mt-3" title="Asosiy ma'lumot">
        <Field label="Sarlavha">
          <input
            value={form.title}
            onChange={(event) => setField('title', event.target.value)}
            maxLength={120}
            placeholder="Masalan: Yunusobodda 3 xonali kvartira"
            className={INPUT_CLASS}
          />
        </Field>

        <div
          role="tablist"
          aria-label="Amal turi"
          className="mt-1 flex rounded-xl bg-[#e8e8ee] p-1"
        >
          {DEALS.map(({ value, label }) => (
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
              {label}
            </button>
          ))}
        </div>

        <div
          role="tablist"
          aria-label="Obyekt turi"
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

      <SectionCard className="mt-3" title="Narx">
        <div className="flex gap-3">
          <Field label="Narx (so'm)" className="flex-1">
            <input
              value={form.priceSom}
              onChange={(event) => setField('priceSom', sanitizeDigits(event.target.value))}
              inputMode="numeric"
              placeholder="480000000"
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Narx ($)" className="flex-1">
            <input
              value={form.priceUsd}
              onChange={(event) => setField('priceUsd', sanitizeDigits(event.target.value))}
              inputMode="numeric"
              placeholder="38000"
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

      <SectionCard className="mt-3" title="Parametrlar">
        <div
          className={cn('grid gap-2', form.type === 'COMMERCIAL' ? 'grid-cols-2' : 'grid-cols-3')}
        >
          {/* Commercial premises are not measured in rooms (§7.4) — the field drops out. */}
          {form.type !== 'COMMERCIAL' && (
            <Field label="Xonalar">
              <input
                value={form.rooms}
                onChange={(event) => setField('rooms', sanitizeDigits(event.target.value))}
                inputMode="numeric"
                placeholder="3"
                className={INPUT_CLASS}
              />
            </Field>
          )}
          <Field label="Maydon, m²">
            <input
              value={form.areaM2}
              onChange={(event) => setField('areaM2', sanitizeDecimal(event.target.value))}
              inputMode="decimal"
              placeholder="65"
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Qavat">
            <input
              value={form.floor}
              onChange={(event) => setField('floor', event.target.value)}
              placeholder="3/9"
              maxLength={20}
              className={INPUT_CLASS}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard className="mt-3" title="Manzil">
        <Field label="Tuman">
          <input
            value={form.district}
            onChange={(event) => setField('district', event.target.value)}
            placeholder="Yunusobod tumani"
            maxLength={60}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="Manzil">
          <input
            value={form.address}
            onChange={(event) => setField('address', event.target.value)}
            placeholder="Ko'cha, uy raqami"
            maxLength={200}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="Mo'ljal">
          <input
            value={form.landmark}
            onChange={(event) => setField('landmark', event.target.value)}
            placeholder="Metro «Shahriston» 10 daq."
            maxLength={120}
            className={INPUT_CLASS}
          />
        </Field>
      </SectionCard>

      <SectionCard className="mt-3" title="Tavsif">
        <textarea
          value={form.description}
          onChange={(event) => setField('description', event.target.value)}
          maxLength={4000}
          rows={5}
          placeholder="Obyekt haqida batafsil yozing..."
          className={cn(INPUT_CLASS, 'min-h-[110px] resize-y')}
        />
      </SectionCard>

      <SectionCard className="mt-3" title="Rasmlar">
        <ImageGrid
          images={images}
          onUpload={(files) => upload.mutate(files)}
          uploading={upload.isPending}
          uploadError={upload.isError ? uploadErrorMessage(upload.error) : null}
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
