"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import type { Fixture, OddsMarket } from "./types";
import { ARB_THRESHOLD_OPTIONS, DEFAULT_ARB_THRESHOLD } from "@/lib/mocks/fixtures/sports-fixtures";
import { ArbGrid } from "./arb-grid";
import { ArbStream } from "./arb-stream";

// ─── Arb Controls Bar ────────────────────────────────────────────────────────

interface ArbControlsProps {
  selectedMarket: OddsMarket;
  onMarketChange: (m: OddsMarket) => void;
  arbThreshold: number;
  onThresholdChange: (t: number) => void;
}

function ArbControls({ selectedMarket, onMarketChange, arbThreshold, onThresholdChange }: ArbControlsProps) {
  // Only offer markets we have mock data for
  const availableMarkets: OddsMarket[] = ["FT Result", "Over/Under 2.5", "BTTS"];

  return (
    <div className="flex items-center gap-3 px-3 py-2 border-b border-zinc-800 bg-[#0d0d0d] flex-wrap">
      {/* Market selector */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider mr-1">Market</span>
        {availableMarkets.map((m) => (
          <button
            key={m}
            onClick={() => onMarketChange(m)}
            className={cn(
              "px-2.5 py-1 text-[10px] font-bold rounded-sm border transition-colors",
              selectedMarket === m
                ? "bg-[#22d3ee]/15 text-[#22d3ee] border-[#22d3ee]/40"
                : "border-zinc-800 text-zinc-500 hover:text-zinc-300",
            )}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="h-4 w-px bg-border mx-1" />

      {/* Arb threshold */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider mr-1">Min Arb</span>
        {ARB_THRESHOLD_OPTIONS.map((t) => (
          <button
            key={t}
            onClick={() => onThresholdChange(t)}
            className={cn(
              "px-2 py-0.5 text-[10px] font-bold rounded-sm border transition-colors tabular-nums",
              arbThreshold === t
                ? "bg-[#4ade80]/15 text-[#4ade80] border-[#4ade80]/40"
                : "border-zinc-800 text-zinc-500 hover:text-zinc-300",
            )}
          >
            {t}%
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Arb Tab ─────────────────────────────────────────────────────────────────

interface ArbTabProps {
  fixtures: Fixture[];
  /** When set with `onArbThresholdChange`, min-arb % is controlled by the parent (e.g. workspace context). */
  arbThreshold?: number;
  onArbThresholdChange?: (t: number) => void;
}

export function ArbTab({ fixtures, arbThreshold: arbThresholdProp, onArbThresholdChange }: ArbTabProps) {
  const [selectedMarket, setSelectedMarket] = React.useState<OddsMarket>("FT Result");
  const [internalThreshold, setInternalThreshold] = React.useState(DEFAULT_ARB_THRESHOLD);
  const isThresholdControlled = arbThresholdProp !== undefined && onArbThresholdChange !== undefined;
  const arbThreshold = isThresholdControlled ? arbThresholdProp : internalThreshold;
  const setArbThreshold = isThresholdControlled ? onArbThresholdChange : setInternalThreshold;

  return (
    <div className="flex flex-col h-full min-h-0">
      <ArbControls
        selectedMarket={selectedMarket}
        onMarketChange={setSelectedMarket}
        arbThreshold={arbThreshold}
        onThresholdChange={setArbThreshold}
      />

      <ResizablePanelGroup direction="horizontal" autoSaveId="sports-arb-layout" className="flex-1 min-h-0">
        {/* Left: Odds grid */}
        <ResizablePanel defaultSize={65} minSize={40} className="flex flex-col min-h-0">
          <div className="px-3 py-1.5 border-b border-zinc-800 bg-zinc-900/30">
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
              Odds Grid: {selectedMarket}
            </span>
          </div>
          <div className="flex-1 overflow-auto">
            <ArbGrid fixtures={fixtures} selectedMarket={selectedMarket} arbThreshold={arbThreshold} />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right: Arb stream */}
        <ResizablePanel defaultSize={35} minSize={25} className="flex flex-col min-h-0 border-l">
          <div className="px-3 py-1.5 border-b border-zinc-800 bg-zinc-900/30">
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Live Arb Stream</span>
          </div>
          <div className="flex-1 min-h-0 overflow-auto">
            <ArbStream arbThreshold={arbThreshold} />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
