import { useState, type ReactNode } from 'react';
import { LeadFormModal } from './lead-form-modal';

interface Props {
  listingId: string;
  className?: string;
  children: ReactNode;
}

/**
 * A self-contained "Raqamimni qoldiraman" trigger (design spec §8.4) — mirrors
 * features/listing-share's ShareButton: owns its own open/close state so a caller
 * (the sticky CTA bar) can drop it in without wiring a modal itself.
 */
export function LeadFormButton({ listingId, className, children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      <LeadFormModal open={open} onClose={() => setOpen(false)} listingId={listingId} />
    </>
  );
}
