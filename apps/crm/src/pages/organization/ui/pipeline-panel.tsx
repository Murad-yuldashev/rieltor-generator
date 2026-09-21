import { Link } from 'react-router';
import type { BookingRow, BookingStatus, ContractRow } from '@rieltor/shared';
import { CONTRACT_STATUS_BADGE, CONTRACT_STATUS_LABELS } from '@/features/contracts';
import { cn } from '@/shared/lib/cn';

/** How many rows each pipeline mini-table shows. */
const RECENT_LIMIT = 5;

// Booking status labels/badges are defined locally (the bookings feature does not
// export them across the FSD boundary), mirroring the bookings page's own map.
const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  ACTIVE: 'Faol',
  CANCELLED: 'Bekor',
  EXPIRED: "Muddati o'tgan",
  CONVERTED: 'Sotildi',
};

const BOOKING_STATUS_BADGE: Record<BookingStatus, string> = {
  ACTIVE: 'bg-brand-amber/10 text-brand-amber',
  CANCELLED: 'bg-ink-3/10 text-ink-3',
  EXPIRED: 'bg-brand-rose/10 text-brand-rose',
  CONVERTED: 'bg-brand-green/10 text-brand-green',
};

const HEAD = 'px-3 py-2 text-left text-[12px] font-semibold text-ink-3';
const CELL = 'px-3 py-2.5 align-top text-[13px] text-ink';

/** Newest first (by createdAt), capped at RECENT_LIMIT. Does not mutate the input. */
function recent<T extends { createdAt: string }>(rows: T[]): T[] {
  return [...rows]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, RECENT_LIMIT);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('uz-UZ');
}

function StatusBadge({ label, tint }: { label: string; tint: string }) {
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-1 text-[11.5px] font-semibold', tint)}>
      {label}
    </span>
  );
}

/**
 * Pipeline panel — the org's most recent bookings and contracts as two compact
 * mini-tables (latest five each), side by side on the widest tier. Read-only
 * previews; the Bandlar / Shartnomalar pages own the full lists and actions.
 */
export function PipelinePanel({
  bookings,
  contracts,
  className,
}: {
  bookings: BookingRow[];
  contracts: ContractRow[];
  className?: string;
}) {
  const recentBookings = recent(bookings);
  const recentContracts = recent(contracts);

  return (
    <section className={cn('grid grid-cols-1 gap-4 desk:grid-cols-2', className)}>
      <div className="rounded-card bg-card p-5 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-bold text-ink">So'nggi bandlar</h2>
          <Link
            to="/bookings"
            className="shrink-0 text-[13px] font-bold text-accent hover:underline"
          >
            Barchasi
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <p className="mt-3 text-[14px] text-ink-3">Hozircha band yo'q</p>
        ) : (
          <table className="mt-3 w-full table-fixed border-collapse">
            <thead>
              <tr className="border-b border-line">
                <th className={HEAD}>Bino / Xonadon</th>
                <th className={cn(HEAD, 'w-[8.5rem] text-right')}>Holat</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((booking) => (
                <tr key={booking.id} className="border-b border-line last:border-0">
                  <td className={CELL}>
                    <span className="block truncate font-semibold text-ink">
                      {booking.buildingName}
                    </span>
                    <span className="block truncate text-[12px] text-ink-3">
                      № {booking.unitNumber}
                    </span>
                  </td>
                  <td className={cn(CELL, 'text-right')}>
                    <StatusBadge
                      label={BOOKING_STATUS_LABELS[booking.status]}
                      tint={BOOKING_STATUS_BADGE[booking.status]}
                    />
                    <span className="mt-1 block text-[12px] whitespace-nowrap text-ink-3">
                      {formatDate(booking.createdAt)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-card bg-card p-5 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-bold text-ink">So'nggi shartnomalar</h2>
          <Link
            to="/contracts"
            className="shrink-0 text-[13px] font-bold text-accent hover:underline"
          >
            Barchasi
          </Link>
        </div>

        {recentContracts.length === 0 ? (
          <p className="mt-3 text-[14px] text-ink-3">Hozircha shartnoma yo'q</p>
        ) : (
          <table className="mt-3 w-full table-fixed border-collapse">
            <thead>
              <tr className="border-b border-line">
                <th className={HEAD}>Raqam / Xaridor</th>
                <th className={cn(HEAD, 'w-[8.5rem] text-right')}>Holat</th>
              </tr>
            </thead>
            <tbody>
              {recentContracts.map((contract) => (
                <tr key={contract.id} className="border-b border-line last:border-0">
                  <td className={CELL}>
                    <Link
                      to={`/contracts/${contract.id}`}
                      className="block truncate font-semibold text-accent hover:underline"
                    >
                      {contract.number}
                    </Link>
                    <span className="block truncate text-[12px] text-ink-3">
                      {contract.buyerName}
                    </span>
                  </td>
                  <td className={cn(CELL, 'text-right')}>
                    <StatusBadge
                      label={CONTRACT_STATUS_LABELS[contract.status]}
                      tint={CONTRACT_STATUS_BADGE[contract.status]}
                    />
                    <span className="mt-1 block text-[12px] whitespace-nowrap text-ink-3">
                      {formatDate(contract.createdAt)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
