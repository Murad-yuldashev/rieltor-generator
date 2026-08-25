import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatListedAt, formatPriceSom, type PriceSnapshot } from '@rieltor/shared';

interface Point {
  label: string;
  modeled: number | null;
  actual: number | null;
}

/** Snapshots (oldest→newest) → recharts rows; the last MODELED point also carries `actual` so the two lines meet. */
function toPoints(snapshots: PriceSnapshot[]): Point[] {
  const rows: Point[] = snapshots.map((s) => ({
    label: formatListedAt(s.capturedAt.slice(0, 10)),
    modeled: s.source === 'MODELED' ? Number(s.estimateSom) : null,
    actual: s.source === 'ACTUAL' ? Number(s.estimateSom) : null,
  }));
  const firstActual = rows.findIndex((r) => r.actual !== null);
  if (firstActual > 0) {
    const prev = rows[firstActual - 1];
    if (prev) prev.actual = prev.modeled;
  }
  return rows;
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { value: number }[] }) {
  if (!active || !payload?.length) return null;
  const value = payload[payload.length - 1]?.value ?? 0;
  return (
    <div className="rounded-[10px] border border-line bg-card px-3 py-2 text-[13px] font-bold shadow-lg">
      {formatPriceSom(String(Math.round(value)), 'SALE')}
    </div>
  );
}

export function PriceChart({
  snapshots,
  height = 220,
}: {
  snapshots: PriceSnapshot[];
  height?: number;
}) {
  const data = toPoints(snapshots);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <defs>
          <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6d28d9" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#6d28d9" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          minTickGap={24}
        />
        <YAxis hide domain={['dataMin', 'dataMax']} />
        <Tooltip content={<ChartTooltip />} />
        <Area type="monotone" dataKey="actual" stroke="none" fill="url(#priceFill)" connectNulls />
        <Line
          type="monotone"
          dataKey="modeled"
          stroke="#a78bfa"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="actual"
          stroke="#6d28d9"
          strokeWidth={2.5}
          dot={false}
          connectNulls
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/** Compact, axis-less sparkline for cabinet cards. `points` are estimateSom strings, oldest→newest. */
export function Sparkline({ points }: { points: string[] }) {
  const data = points.map((p, i) => ({ i, v: Number(p) }));
  return (
    <ResponsiveContainer width="100%" height={40}>
      <ComposedChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <YAxis hide domain={['dataMin', 'dataMax']} />
        <Line type="monotone" dataKey="v" stroke="#6d28d9" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export default PriceChart;
