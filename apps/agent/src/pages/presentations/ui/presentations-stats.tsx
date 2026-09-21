import type { PresentationSummary } from '@rieltor/shared';
import { StatTile, StatTileRow } from '@/shared/ui/stat-tile';

/**
 * Client-derived KPI row over the loaded presentations list: total count, the
 * summed opens across every presentation, the average opens per presentation
 * (a string so a trailing `.0` shows), and how many have never been opened.
 */
export function PresentationsStats({ list }: { list: PresentationSummary[] }) {
  const total = list.length;
  const totalOpens = list.reduce((sum, p) => sum + p.opensCount, 0);
  const avgOpens = total > 0 ? (totalOpens / total).toFixed(1) : '0.0'; // String -> trailing .0 shows
  const unopened = list.filter((p) => p.opensCount === 0).length;
  return (
    <StatTileRow className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-4">
      <StatTile label="Jami taqdimotlar" value={total} />
      <StatTile label="Jami ochilishlar" value={totalOpens} tone="green" />
      <StatTile label="O'rtacha ochilish" value={avgOpens} />
      <StatTile label="Ochilmagan" value={unopened} tone={unopened > 0 ? 'amber' : 'default'} />
    </StatTileRow>
  );
}
