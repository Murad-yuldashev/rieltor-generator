import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import type { ListingSummary, ListingType } from '@rieltor/shared';
import { LISTING_TYPE_META, LISTING_TYPES, ListingCard, useListings } from '@/entities/listing';
import { AddToCollectionModal } from '@/features/collections';
import { ListingContentButton } from '@/features/listing-content';
import { NoteEditor, useNotes } from '@/features/notes';
import { Icon } from '@/shared/ui/icon';

type TypeFilter = ListingType | 'ALL';

/** The largest rooms bucket is "5+" — anything above it falls into the same bucket. */
const MAX_ROOMS_BUCKET = 5;
const ROOMS_BUCKETS = [1, 2, 3, 4, MAX_ROOMS_BUCKET] as const;

function matchesRooms(listing: ListingSummary, rooms: number | null): boolean {
  if (rooms === null) return true;
  // Commercial premises carry no room count, so a room filter excludes them.
  if (listing.rooms === null) return false;
  return rooms >= MAX_ROOMS_BUCKET ? listing.rooms >= rooms : listing.rooms === rooms;
}

interface Selection {
  listingId: string;
  title: string;
}

/**
 * The cabinet's listing browser. Fetches the full published catalogue once
 * (`GET /api/objects`) and filters it entirely client-side by district, type and
 * rooms — mirroring the marketplace's current filtering. Each card opens the
 * private-note editor; the "has a note" state is read from the notes list so a
 * card the realtor already annotated shows an active button.
 */
export function BrowsePage() {
  const { data: listings, isPending, isError } = useListings();
  const { data: notes } = useNotes();

  const [district, setDistrict] = useState<string>('ALL');
  const [type, setType] = useState<TypeFilter>('ALL');
  const [rooms, setRooms] = useState<number | null>(null);
  const [editing, setEditing] = useState<Selection | null>(null);
  const [collecting, setCollecting] = useState<Selection | null>(null);

  // Districts that actually appear in the catalogue — deduped, sorted. Deriving
  // from live listings keeps every option non-empty (mirrors the marketplace).
  const districts = useMemo(() => {
    const set = new Set((listings ?? []).map((l) => l.district));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [listings]);

  // Listing ids the realtor has a note on — drives each card's active state.
  const notedIds = useMemo(() => new Set((notes ?? []).map((n) => n.listingId)), [notes]);

  const filtered = useMemo(
    () =>
      (listings ?? []).filter(
        (l) =>
          (district === 'ALL' || l.district === district) &&
          (type === 'ALL' || l.type === type) &&
          matchesRooms(l, rooms),
      ),
    [listings, district, type, rooms],
  );

  return (
    <main className="mx-auto min-h-dvh max-w-content bg-surface px-4 py-6">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1 text-[13px] font-semibold text-ink-2"
      >
        <Icon name="chevronLeft" className="size-4" />
        Kabinetga qaytish
      </Link>

      <header className="mb-5">
        <p className="text-[13px] font-semibold text-ink-2">Rieltor kabineti</p>
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink">E'lonlar</h1>
      </header>

      {/* Filters */}
      <div className="mb-5 flex flex-col gap-3">
        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          aria-label="Tuman"
          className="w-full rounded-[12px] border border-line bg-card px-3.5 py-2.5 text-[14px] font-semibold text-ink outline-none focus:border-accent"
        >
          <option value="ALL">Barcha tumanlar</option>
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <div className="flex flex-wrap gap-2">
          <FilterChip active={type === 'ALL'} onClick={() => setType('ALL')}>
            Barchasi
          </FilterChip>
          {LISTING_TYPES.map((t) => (
            <FilterChip key={t} active={type === t} onClick={() => setType(t)}>
              {LISTING_TYPE_META[t].label}
            </FilterChip>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterChip active={rooms === null} onClick={() => setRooms(null)}>
            Xona: barchasi
          </FilterChip>
          {ROOMS_BUCKETS.map((n) => (
            <FilterChip key={n} active={rooms === n} onClick={() => setRooms(n)}>
              {n === MAX_ROOMS_BUCKET ? `${n}+` : n}
            </FilterChip>
          ))}
        </div>
      </div>

      {isPending ? (
        <p className="text-[15px] font-semibold text-ink-2">Yuklanmoqda...</p>
      ) : isError ? (
        <p className="rounded-card bg-card p-4 text-[14px] font-semibold text-brand-rose shadow-card">
          E'lonlarni yuklab bo'lmadi. Sahifani yangilang.
        </p>
      ) : filtered.length === 0 ? (
        <p className="rounded-card bg-card p-6 text-center text-[14px] font-semibold text-ink-2 shadow-card">
          Ushbu filtrlarga mos e'lon topilmadi.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((listing, i) => (
            <div key={listing.id}>
              <ListingCard
                listing={listing}
                isFirst={i === 0}
                hasNote={notedIds.has(listing.id)}
                onNote={() => setEditing({ listingId: listing.id, title: listing.title })}
                onCollect={() => setCollecting({ listingId: listing.id, title: listing.title })}
              />
              <ListingContentButton listing={listing} />
            </div>
          ))}
        </div>
      )}

      {editing && (
        <NoteEditor
          listingId={editing.listingId}
          listingTitle={editing.title}
          onClose={() => setEditing(null)}
        />
      )}

      {collecting && (
        <AddToCollectionModal
          listingId={collecting.listingId}
          listingTitle={collecting.title}
          onClose={() => setCollecting(null)}
        />
      )}
    </main>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? 'rounded-full bg-accent px-3.5 py-1.5 text-[13px] font-semibold text-white'
          : 'rounded-full bg-card px-3.5 py-1.5 text-[13px] font-semibold text-ink-2 shadow-card'
      }
    >
      {children}
    </button>
  );
}
