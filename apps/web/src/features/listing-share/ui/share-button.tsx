import { useState, type ReactNode } from 'react';
import type { ShareCaptionListing } from '@rieltor/shared';
import { SharePanel } from './share-panel';

interface Props {
  listingId: string;
  listing: Omit<ShareCaptionListing, 'url'>;
  className?: string;
  children: ReactNode;
}

/** A self-contained "Ulashish" trigger: owns its own open/close state, so a caller
 *  (e.g. a row in the cabinet's listing list) can drop it in without wiring a
 *  SharePanel itself. features/listing-form wires SharePanel directly instead, since
 *  it also needs to open it programmatically right after a publish succeeds. */
export function ShareButton({ listingId, listing, className, children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      <SharePanel
        open={open}
        onClose={() => setOpen(false)}
        listingId={listingId}
        listing={listing}
      />
    </>
  );
}
