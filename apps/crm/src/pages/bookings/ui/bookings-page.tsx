import { useState } from 'react';
import type { BookingRow, BookingStatus } from '@rieltor/shared';
import { useBookingActionGlobal, useBookings } from '@/features/booking';
import { CabinetNav } from '@/widgets/cabinet-nav';
import { cn } from '@/shared/lib/cn';

const SHELL = 'mx-auto flex min-h-dvh max-w-content flex-col gap-5 bg-surface px-5 py-8';
const CELL = 'whitespace-nowrap px-3 py-2.5 text-[13px] text-ink align-top';
const HEAD = 'whitespace-nowrap px-3 py-2.5 text-left text-[12px] font-semibold text-ink-3';
const ROW_INPUT =
  'w-full rounded-[10px] border border-line bg-surface px-2 py-1.5 text-[13px] text-ink outline-none focus:border-accent';

/** Uzbek labels for a booking's lifecycle status (UI copy only). */
const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  ACTIVE: 'Faol',
  CANCELLED: 'Bekor',
  EXPIRED: "Muddati o'tgan",
  CONVERTED: 'Sotildi',
};

/** Badge tint per booking status. */
const BOOKING_STATUS_BADGE: Record<BookingStatus, string> = {
  ACTIVE: 'bg-brand-amber/10 text-brand-amber',
  CANCELLED: 'bg-ink-3/10 text-ink-3',
  EXPIRED: 'bg-brand-rose/10 text-brand-rose',
  CONVERTED: 'bg-brand-green/10 text-brand-green',
};

/**
 * Bandlar (`/bookings`) — the org-wide bookings list. Each row shows its building
 * + unit, the client, the hold-until date, and a status badge. Active holds get
 * cancel / convert actions (they invalidate `['crm-bookings']` so the row status
 * updates without a manual refetch).
 */
export function BookingsPage() {
  const { data: bookings, isPending, isError } = useBookings();

  return (
    <main className={SHELL}>
      <CabinetNav />

      <h1 className="text-[22px] font-extrabold tracking-tight text-ink">Bandlar</h1>

      {isPending ? (
        <p className="text-[15px] font-semibold text-ink-2">Yuklanmoqda...</p>
      ) : isError || !bookings ? (
        <p className="text-[14px] font-semibold text-brand-rose">
          Bandlarni yuklab bo'lmadi. Qayta urinib ko'ring.
        </p>
      ) : bookings.length === 0 ? (
        <p className="text-[14px] text-ink-3">Hozircha band yo'q</p>
      ) : (
        <section className="rounded-card bg-card p-5 shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line">
                  <th className={HEAD}>Bino / Xonadon</th>
                  <th className={HEAD}>Mijoz</th>
                  <th className={HEAD}>Muddat</th>
                  <th className={HEAD}>Holat</th>
                  <th className={HEAD} aria-label="Amallar" />
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <BookingRowItem key={booking.id} booking={booking} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}

/** One booking row; active holds render inline cancel / convert controls. */
function BookingRowItem({ booking }: { booking: BookingRow }) {
  return (
    <tr className="border-b border-line">
      <td className={cn(CELL, 'font-semibold')}>
        <span className="block text-ink">{booking.buildingName}</span>
        <span className="block text-[12px] font-normal text-ink-3">№ {booking.unitNumber}</span>
      </td>
      <td className={CELL}>
        <span className="block text-ink">{booking.clientName}</span>
        <span className="block text-[12px] text-ink-3">{booking.clientPhone}</span>
      </td>
      <td className={CELL}>{new Date(booking.holdUntil).toLocaleDateString('uz-UZ')}</td>
      <td className={CELL}>
        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-[12px] font-semibold',
            BOOKING_STATUS_BADGE[booking.status],
          )}
        >
          {BOOKING_STATUS_LABELS[booking.status]}
        </span>
      </td>
      <td className={CELL}>
        {booking.status === 'ACTIVE' ? (
          <BookingRowActions booking={booking} />
        ) : (
          <span className="text-ink-3">—</span>
        )}
      </td>
    </tr>
  );
}

/** Cancel (with optional reason) / convert controls for an active hold. */
function BookingRowActions({ booking }: { booking: BookingRow }) {
  const action = useBookingActionGlobal();
  const [cancelReason, setCancelReason] = useState('');

  function handleCancel() {
    action.mutate({
      bookingId: booking.id,
      action: 'cancel',
      cancelReason: cancelReason.trim() ? cancelReason.trim() : undefined,
    });
  }

  function handleConvert() {
    action.mutate({ bookingId: booking.id, action: 'convert' });
  }

  return (
    <div className="flex min-w-[220px] flex-col gap-1.5">
      <input
        aria-label="Bekor qilish sababi"
        value={cancelReason}
        onChange={(event) => setCancelReason(event.target.value)}
        maxLength={500}
        placeholder="Bekor sababi (ixtiyoriy)"
        className={ROW_INPUT}
      />
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={handleCancel}
          disabled={action.isPending}
          className="flex-1 rounded-[10px] border border-brand-rose px-3 py-1.5 text-[12px] font-bold text-brand-rose disabled:opacity-60"
        >
          {action.isPending ? '...' : 'Bekor'}
        </button>
        <button
          type="button"
          onClick={handleConvert}
          disabled={action.isPending}
          className="flex-1 rounded-[10px] bg-brand-green px-3 py-1.5 text-[12px] font-extrabold text-white disabled:opacity-60"
        >
          {action.isPending ? '...' : 'Sotildi'}
        </button>
      </div>
      {action.isError && (
        <p className="text-[12px] font-semibold text-brand-rose">
          Amalni bajarishda xatolik. Qayta urinib ko'ring.
        </p>
      )}
    </div>
  );
}
