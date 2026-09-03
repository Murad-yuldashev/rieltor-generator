import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import {
  BookingRowSchema,
  BookingSchema,
  type BookingAction,
  type BookingCreate,
  type UnitBulkUpdate,
} from '@rieltor/shared';
import { apiGet, apiPatch, apiPost } from '@/shared/api/client';

// These two caches are owned by other features (units by `developer`, bookings by
// T8's page), so we can't import their key builders across the FSD feature boundary.
// The literals below MUST match `unitsQueryKey(buildingId)` (= ['crm-units', id])
// that `useUnits` reads, and the ['crm-bookings'] key T8's list reads.
const unitsQueryKey = (buildingId: string) => ['crm-units', buildingId] as const;
const BOOKINGS_QUERY_KEY = ['crm-bookings'] as const;

/** Response of `PATCH /api/crm/units/bulk` — how many units changed vs. skipped. */
const BulkUpdateResultSchema = z.object({ updated: z.number(), skippedBooked: z.number() });

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

/**
 * Same `PATCH /api/crm/bookings/:id` action, but from a context with no building
 * id (the org-wide bookings list). We can only refresh the bookings query — the
 * per-building units caches are refreshed lazily when each building is next opened.
 */
export function useBookingActionGlobal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, ...body }: { bookingId: string } & BookingAction) =>
      apiPatch(`/api/crm/bookings/${bookingId}`, BookingSchema, {
        action: body.action,
        cancelReason: body.cancelReason,
        holdDays: body.holdDays,
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEY }),
  });
}

/**
 * `PATCH /api/crm/units/bulk` — set status and/or price on many units at once from
 * the shaxmatka bulk-edit bar. Booked units are skipped server-side (reported as
 * `skippedBooked`). On success we invalidate the building's units so the grid
 * recolours to the new statuses.
 */
export function useBulkUpdateUnits(buildingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UnitBulkUpdate) =>
      apiPatch('/api/crm/units/bulk', BulkUpdateResultSchema, body),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: unitsQueryKey(buildingId) }),
  });
}

/**
 * `GET /api/crm/bookings` — the org-wide bookings list (each row carries its unit
 * number + building name). Read by the Bandlar page; keyed `['crm-bookings']` so
 * every booking action can invalidate it.
 */
export function useBookings() {
  return useQuery({
    queryKey: BOOKINGS_QUERY_KEY,
    queryFn: () => apiGet('/api/crm/bookings', z.array(BookingRowSchema)),
  });
}
