import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { ListingType } from '@rieltor/shared';
import { openLoginModal, useSession } from '@/entities/session';
import { useCreateTrackedProperty } from '@/entities/tracked-property';
import { ApiError } from '@/shared/api/client';

/** The valuation params we just computed a price for — the body of the track request. */
export interface TrackPropertyParams {
  type: ListingType;
  district: string;
  rooms: number | null;
  areaM2: number;
}

/**
 * The retention hook that closes the loop after a valuation: save this property
 * to "Mening uyim" so its modeled price history keeps updating. A logged-in tap
 * creates the tracked property and drops the seller straight onto its detail
 * page; an anonymous tap opens the shared login modal first (the visitor can
 * retry the save afterwards).
 */
export function TrackPropertyButton({ params }: { params: TrackPropertyParams }) {
  const { isAuthenticated } = useSession();
  const create = useCreateTrackedProperty();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }
    setError(null);
    try {
      const property = await create.mutateAsync(params);
      navigate(`/my/properties/${property.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Saqlab bo'lmadi. Qaytadan urinib ko'ring.");
    }
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={onClick}
        disabled={create.isPending}
        className="w-full rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark px-5 py-3.5 text-[14.5px] font-extrabold text-white shadow-lg shadow-accent/35 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {create.isPending ? 'Saqlanmoqda...' : "Uyni kuzatishga qo'shish"}
      </button>
      {error && <p className="mt-2 text-[13px] font-semibold text-brand-rose">{error}</p>}
    </div>
  );
}
