import type {
  CollectionSummary,
  Lead,
  LeadStats,
  PresentationSummary,
  WalletView,
} from '@rieltor/shared';
import { formatPriceSom } from '@rieltor/shared';
import { StatTile, StatTileRow } from '@/shared/ui/stat-tile';

/** Placeholder shown in the money tile while the wallet query is still loading. */
const MONEY_PLACEHOLDER = '—';

/**
 * The six dashboard KPI tiles, all derived client-side from data the cabinet
 * already loads. Every source is optional and degrades to 0 / a placeholder
 * rather than blocking the whole dashboard while its query resolves.
 */
export function DashboardKpis({
  wallet,
  myLeads,
  leadStats,
  collections,
  presentations,
}: {
  wallet: WalletView | undefined;
  myLeads: Lead[] | undefined;
  leadStats: LeadStats | undefined;
  collections: CollectionSummary[] | undefined;
  presentations: PresentationSummary[] | undefined;
}) {
  const leads = myLeads ?? [];
  const activeLeads = leads.filter(
    (l) => l.outcomeStage !== 'WON' && l.outcomeStage !== 'LOST',
  ).length;
  const activeFixations = leads.filter((l) => l.fixation?.status === 'ACTIVE').length;

  // A negative wallet balance is a DEBT. balanceSom is a BigInt-as-string that may not
  // fit in a number, so the sign is read off the string ('-' prefix), never Number()-ed.
  const isDebt = wallet != null && wallet.balanceSom.startsWith('-');

  return (
    <StatTileRow className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      <StatTile
        label="Hisob balansi"
        value={wallet ? formatPriceSom(wallet.balanceSom, 'SALE') : MONEY_PLACEHOLDER}
        tone={isDebt ? 'rose' : 'default'}
        badge={isDebt ? 'Qarz' : undefined}
      />
      <StatTile label="Olingan leadlar" value={leads.length} sub={`${activeLeads} faol`} />
      <StatTile label="Bitimlar" value={leadStats ? leadStats.funnel.WON : 0} tone="green" />
      <StatTile label="Faol fiksatsiyalar" value={activeFixations} />
      <StatTile label="To'plamlar" value={(collections ?? []).length} />
      <StatTile label="Taqdimotlar" value={(presentations ?? []).length} />
    </StatTileRow>
  );
}
