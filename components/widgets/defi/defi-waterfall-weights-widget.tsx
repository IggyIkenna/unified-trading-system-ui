"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useDeFiData } from "./defi-data-context";
import { formatNumber } from "@/lib/utils/formatters";

const BAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-orange-500",
];

function HorizontalBar({ label, pct, colorIdx }: { label: string; pct: number; colorIdx: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-mono w-12 shrink-0">{label}</span>
      <div className="flex-1 h-5 bg-muted/30 rounded overflow-hidden">
        <div
          className={cn("h-full rounded transition-all", BAR_COLORS[colorIdx % BAR_COLORS.length])}
          style={{ width: `${Math.max(pct * 100, 2)}%`, opacity: 0.7 }}
        />
      </div>
      <span className="text-xs font-mono text-muted-foreground w-12 text-right">
        {formatNumber(pct * 100, 0)}%
      </span>
    </div>
  );
}

export function DeFiWaterfallWeightsWidget(_props: WidgetComponentProps) {
  const { waterfallWeights } = useDeFiData();
  const [selectedCoin, setSelectedCoin] = React.useState<string | null>(null);

  const coins = Object.keys(waterfallWeights.coin_weights);

  return (
    <div className="space-y-3 p-1">
      {/* Pillar 1: Coin Weights */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Pillar 1: Coin Allocation</p>
          <Badge variant="outline" className="text-[10px]">Patrick (restricted)</Badge>
        </div>
        {coins.map((coin, idx) => (
          <button
            key={coin}
            className={cn(
              "w-full text-left rounded hover:bg-muted/20 px-1 py-0.5 transition-colors",
              selectedCoin === coin && "bg-muted/30 ring-1 ring-primary/30",
            )}
            onClick={() => setSelectedCoin(selectedCoin === coin ? null : coin)}
          >
            <HorizontalBar label={coin} pct={waterfallWeights.coin_weights[coin] ?? 0} colorIdx={idx} />
          </button>
        ))}
      </div>

      {/* Pillar 2: Per-coin venue weights */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">
          Pillar 2: Venue Weights {selectedCoin ? `(${selectedCoin})` : "(select a coin above)"}
        </p>
        {selectedCoin && waterfallWeights.venue_weights[selectedCoin] ? (
          <>
            {Object.entries(waterfallWeights.venue_weights[selectedCoin]).map(([venue, weight], idx) => (
              <div key={venue} className="flex items-center gap-1">
                <HorizontalBar label={venue.slice(0, 6)} pct={weight} colorIdx={idx + 2} />
                {waterfallWeights.restricted_venues.includes(venue) && (
                  <Badge variant="destructive" className="text-[9px] h-4 px-1">Restricted</Badge>
                )}
              </div>
            ))}
          </>
        ) : (
          <p className="text-xs text-muted-foreground italic">Click a coin in Pillar 1 to see venue breakdown.</p>
        )}
      </div>

      {/* Restricted venues legend */}
      {waterfallWeights.restricted_venues.length > 0 && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
          Patrick restricted from: {waterfallWeights.restricted_venues.join(", ")}
        </div>
      )}
    </div>
  );
}
