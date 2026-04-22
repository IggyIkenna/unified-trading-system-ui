"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Info } from "lucide-react";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import type { PredictionArbMarketType } from "@/components/trading/predictions/types";
import { PredActiveArbCard } from "./pred-arb-ui";
import { usePredictionsData } from "./predictions-data-context";

// UI-only constant — defined here, not in lib/mocks/
const ARB_THRESHOLD_OPTIONS = [0.5, 1.0, 1.5, 2.0, 3.0] as const;

export function PredArbStreamWidget(_props: WidgetComponentProps) {
  const {
    activeArbs,
    arbNewIds,
    arbThreshold,
    setArbThreshold,
    arbMarketTypeFilter,
    setArbMarketTypeFilter,
    executeArb,
  } = usePredictionsData();

  // PredictionsDataContext is synchronous (mock) — isLoading is always false.
  // When the context adds isLoading + error fields, wire them here.
  const isLoading = false;
  const error: string | null = null;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-xs text-muted-foreground">Loading arb stream…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-xs text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <div className="flex flex-wrap items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-caption text-muted-foreground">Min arb:</span>
          <div className="flex items-center gap-0.5 rounded-md border border-zinc-800 bg-zinc-900/60 p-0.5">
            {ARB_THRESHOLD_OPTIONS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setArbThreshold(t)}
                className={cn(
                  "px-2 py-1 text-micro font-bold rounded transition-colors tabular-nums",
                  arbThreshold === t ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300",
                )}
              >
                {t}%
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-0.5 rounded-md border border-zinc-800 bg-zinc-900/60 p-0.5">
          {(["all", "football", "crypto", "tradfi"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setArbMarketTypeFilter(type as PredictionArbMarketType | "all")}
              className={cn(
                "px-2.5 py-1 text-micro font-bold rounded transition-colors capitalize",
                arbMarketTypeFilter === type ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300",
              )}
            >
              {type === "all" ? "All" : type === "tradfi" ? "TradFi" : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1.5 text-micro text-zinc-600">
          <Info className="size-3" />
          Refreshes every 8s · decay bar = time remaining
        </div>
      </div>

      <div className="space-y-2 min-h-0">
        <div className="flex items-center gap-2">
          <span className="text-micro font-black uppercase tracking-widest text-zinc-500">Live Opportunities</span>
          {activeArbs.length > 0 && (
            <span className="flex items-center gap-1 text-micro text-[var(--pnl-positive)]">
              <span className="relative flex size-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--pnl-positive)] opacity-60" />
                <span className="relative inline-flex rounded-full size-1.5 bg-[var(--pnl-positive)]" />
              </span>
              {activeArbs.length} active
            </span>
          )}
        </div>

        {activeArbs.length === 0 ? (
          <Card className="bg-zinc-900/30 border-zinc-800">
            <CardContent className="py-10 text-center space-y-2">
              <Clock className="size-8 text-zinc-700 mx-auto" />
              <p className="text-xs text-zinc-600">No arbs above {arbThreshold}% threshold</p>
              <p className="text-micro text-zinc-700">Stream re-checks every 8s</p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {activeArbs.map((arb) => (
              <PredActiveArbCard key={arb.id} arb={arb} isNew={arbNewIds.has(arb.id)} onExecute={executeArb} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
