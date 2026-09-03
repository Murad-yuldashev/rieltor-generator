import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BookingSchema, type BookingAction, type BookingCreate } from '@rieltor/shared';
import { apiPatch, apiPost } from '@/shared/api/client';

// These two caches are owned by other features (units by `developer`, bookings by
// T8's page), so we can't import their key builders across the FSD feature boundary.
// The literals below MUST match `unitsQueryKey(buildingId)` (= ['crm-units', id])
// that `useUnits` reads, and the ['crm-bookings'] key T8's list will read.
const unitsQueryKey = (buildingId: string) => ['crm-units', buildingId] as const;
const BOOKINGS_QUERY_KEY = ['crm-bookings'] as const;

/**
 * `POST /api/crm/units/:id/book` — place a hold on an available unit. On success we
 * invalidate the owning building's units query (the same `['crm-units', buildingId]`
 * key `useUnits` reads) so the shaxmatka cell recolours AVAILABLE → BOOKED.
 */
export function useBookUnit(buildingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ unitId, ...body }: { unitId: string } & BookingCreate) =>
      apiPost(`/api/crm/units/${unitId}/book`, BookingSchema, {
        clientName: body.clientName,
        clientPhone: body.clientPhone,
        holdDays: body.holdDays,
        note: body.note,
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: unitsQueryKey(buildingId) }),
  });
}

/**
 * `PATCH /api/crm/bookings/:id` — cancel / convert / extend an existing hold. On
 * success we refresh both the building's units (the cell recolours: cancel →
 * AVAILABLE, convert → SOLD) and the org-wide bookings list.
 */
export function useBookingAction(buildingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, ...body }: { bookingId: string } & BookingAction) =>
      apiPatch(`/api/crm/bookings/${bookingId}`, BookingSchema, {
        action: body.action,
        cancelReason: body.cancelReason,
        holdDays: body.holdDays,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: unitsQueryKey(buildingId) });
      void queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEY });
    },
  });
}
