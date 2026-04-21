import type { PnLComponent } from "@/lib/types/pnl";

export const POS_FILL = "var(--pnl-positive)";
export const NEG_FILL = "var(--pnl-negative)";

export interface FactorSubviewProps {
  components: PnLComponent[];
  selectedFactor: string | null;
  onSelect: (name: string) => void;
}

export function formatSignedCompact(value: number): string {
  const sign = value >= 0 ? "+" : "\u2212";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 1 : 2)}M`;
  if (abs >= 10_000) return `${sign}$${(abs / 1000).toFixed(1)}k`;
  if (abs >= 1_000) return `${sign}$${(abs / 1000).toFixed(2)}k`;
  return `${sign}$${Math.round(abs).toLocaleString("en-US")}`;
}

export function formatAxisCompact(value: number): string {
  const sign = value >= 0 ? "" : "\u2212";
  const abs = Math.abs(value);
  if (abs === 0) return "0";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1000) return `${sign}$${Math.round(abs / 1000)}k`;
  return `${sign}$${Math.round(abs)}`;
}

export function FactorTooltipCard({
  name,
  signed,
  pctOfAbs,
  rank,
  total,
}: {
  name: string;
  signed: number;
  pctOfAbs: number;
  rank: number;
  total: number;
}) {
  const isNeg = signed < 0;
  return (
    <div className="rounded-md border border-border/80 bg-popover/95 shadow-lg px-2.5 py-2 backdrop-blur-sm min-w-[160px]">
      <div className="flex items-center justify-between gap-3 pb-1.5 mb-1.5 border-b border-border/60">
        <span className="text-[11px] font-semibold tracking-tight text-foreground truncate">{name}</span>
        <span className="text-nano font-mono tabular-nums text-muted-foreground shrink-0">
          #{rank} / {total}
        </span>
      </div>
      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-micro">
        <span className="text-muted-foreground">P&amp;L</span>
        <span
          className="font-mono tabular-nums text-right font-semibold"
          style={{ color: isNeg ? "var(--pnl-negative)" : "var(--pnl-positive)" }}
        >
          {formatSignedCompact(signed)}
        </span>
        <span className="text-muted-foreground">% of |net|</span>
        <span className="font-mono tabular-nums text-right text-foreground/90">{pctOfAbs.toFixed(2)}%</span>
      </div>
    </div>
  );
}

export function rankByMagnitude(components: PnLComponent[]): Array<PnLComponent & { rank: number; abs: number }> {
  return [...components]
    .map((c) => ({ ...c, abs: Math.abs(c.value) }))
    .sort((a, b) => b.abs - a.abs)
    .map((c, i) => ({ ...c, rank: i + 1 }));
}
