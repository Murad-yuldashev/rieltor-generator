import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { formatPriceSom, type ListingSummary, type ListingType } from '@rieltor/shared';
import { LISTING_TYPE_META, LISTING_TYPES, ListingCard, useListings } from '@/entities/listing';
import { AddToCollectionModal } from '@/features/collections';
import { ListingContentButton } from '@/features/listing-content';
import { NoteEditor, useNotes } from '@/features/notes';
import { Icon } from '@/shared/ui/icon';
import { StatTile, StatTileRow } from '@/shared/ui/stat-tile';

type TypeFilter = ListingType | 'ALL';

/** The largest rooms bucket is "5+" — anything above it falls into the same bucket. */
const MAX_ROOMS_BUCKET = 5;
const ROOMS_BUCKETS = [1, 2, 3, 4, MAX_ROOMS_BUCKET] as const;

// Vertical card grid: one column on phone, filling out to four across on the desktop
// tier (mirrors the web marketplace listing grid and the CRM complexes grid).
const GRID =
  'flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4 lg:grid-cols-3 desk:grid-cols-4 desk:gap-5';

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
 * rooms — mirroring the marketplace's current filtering. A client-derived stat row
 * (over the currently-filtered set) sits above CRM-style facet chip rails (counted
 * over the full loaded list so a chip never zeroes its own dimension) and a responsive
 * cover-image card grid. Each card opens the private-note editor; the "has a note"
 * state is read from the notes list so a card the realtor already annotated shows an
 * active button.
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

  // Result summary over the CURRENTLY-FILTERED set. priceSom is a BigInt-string, so
  // min/max/sum/avg stay in BigInt (never Number()); the aggregate mixes SALE+RENT, so
  // 'SALE' formatting avoids a misleading /oy suffix.
  const stats = useMemo(() => {
    if (filtered.length === 0) return null;
    const prices = filtered.map((l) => BigInt(l.priceSom));
    // `filtered` is non-empty here (guarded above), so `?? 0n` only narrows the type.
    let min = prices[0] ?? 0n;
    let max = prices[0] ?? 0n;
    let sum = 0n;
    for (const p of prices) {
      if (p < min) min = p;
      if (p > max) max = p;
      sum += p;
    }
    const avg = sum / BigInt(filtered.length); // integer floor; N is small
    return {
      count: filtered.length,
      avg: formatPriceSom(avg.toString(), 'SALE'),
      min: formatPriceSom(min.toString(), 'SALE'),
      max: formatPriceSom(max.toString(), 'SALE'),
    };
  }, [filtered]);

  // Facet COUNTS are computed over the FULL loaded list (not `filtered`) so selecting a
  // chip never zeroes out its own dimension.
  const typeFacets = useMemo(() => {
    const base = listings ?? [];
    return LISTING_TYPES.map((t) => ({
      value: t,
      label: LISTING_TYPE_META[t].label,
      count: base.filter((l) => l.type === t).length,
    })).filter((f) => f.count > 0);
  }, [listings]);

  const districtFacets = useMemo(() => {
    const base = listings ?? [];
    return districts.map((d) => ({ value: d, count: base.filter((l) => l.district === d).length }));
  }, [listings, districts]);

  const roomsFacets = useMemo(() => {
    const base = listings ?? [];
    return ROOMS_BUCKETS.map((n) => ({
      value: n,
      label: n === MAX_ROOMS_BUCKET ? `${n}+` : String(n),
      count: base.filter((l) => matchesRooms(l, n)).length,
    })).filter((f) => f.count > 0);
  }, [listings]);

  return (
    <main className="flex flex-col gap-5">
      <Link to="/" className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink-2">
        <Icon name="chevronLeft" className="size-4" />
        Kabinetga qaytish
      </Link>

      <header>
        <p className="text-[13px] font-semibold text-ink-2">Rieltor kabineti</p>
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink">E'lonlar</h1>
      </header>

      {stats && (
        <StatTileRow className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Topilgan e'lonlar" value={stats.count} />
          <StatTile label="O'rtacha narx" value={stats.avg} />
          <StatTile label="Eng arzon" value={stats.min} tone="green" />
          <StatTile label="Eng qimmat" value={stats.max} />
        </StatTileRow>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <FacetChip
            label="Barcha tumanlar"
            active={district === 'ALL'}
            onClick={() => setDistrict('ALL')}
          />
          {districtFacets.map((f) => (
            <FacetChip
              key={f.value}
              label={`${f.value} · ${f.count}`}
              active={district === f.value}
              onClick={() => setDistrict(f.value)}
            />
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <FacetChip label="Barchasi" active={type === 'ALL'} onClick={() => setType('ALL')} />
          {typeFacets.map((f) => (
            <FacetChip
              key={f.value}
              label={`${f.label} · ${f.count}`}
              active={type === f.value}
              onClick={() => setType(f.value)}
            />
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <FacetChip
            label="Xona: barchasi"
            active={rooms === null}
            onClick={() => setRooms(null)}
          />
          {roomsFacets.map((f) => (
            <FacetChip
              key={f.value}
              label={`${f.label} · ${f.count}`}
              active={rooms === f.value}
              onClick={() => setRooms(f.value)}
            />
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
        <div className={GRID}>
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

/** A CRM-style facet chip — teal when active, neutral surface otherwise. */
function FacetChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-bold transition-colors ${
        active ? 'bg-accent text-white' : 'bg-surface text-ink-2'
      }`}
    >
      {label}
    </button>
  );
}
