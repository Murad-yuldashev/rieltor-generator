import { formatListedAt, type NoteWithListing } from '@rieltor/shared';
import { StatTile, StatTileRow } from '@/shared/ui/stat-tile';

export function NotesStats({ notes }: { notes: NoteWithListing[] }) {
  const total = notes.length;
  const sale = notes.filter((n) => n.listing.deal === 'SALE').length;
  const rent = notes.filter((n) => n.listing.deal === 'RENT').length;
  const latest = notes[0]?.updatedAt; // list is newest-first
  return (
    <StatTileRow className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatTile label="Jami eslatmalar" value={total} />
      <StatTile label="Sotuv" value={sale} tone="green" />
      <StatTile label="Ijara" value={rent} />
      <StatTile label="So'nggi" value={latest ? formatListedAt(latest.slice(0, 10)) : '—'} />
    </StatTileRow>
  );
}
