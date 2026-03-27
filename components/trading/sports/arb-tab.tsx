"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import type { Fixture, OddsMarket } from "./types";
import { ARB_THRESHOLD_OPTIONS, DEFAULT_ARB_THRESHOLD } from "./mock-fixtures";
import { ArbGrid } from "./arb-grid";
import { ArbStream } from "./arb-stream";

// ─── Arb Controls Bar ────────────────────────────────────────────────────────

interface ArbControlsProps {
  selectedMarket: OddsMarket;
  onMarketChange: (m: OddsMarket) => void;
  arbThreshold: number;
  onThresholdChange: (t: number) => void;
}

function ArbControls({
  selectedMarket,
  onMarketChange,
  arbThreshold,
  onThresholdChange,
}: ArbControlsProps) {
  // Only offer markets we have mock data for
  const availableMarkets: OddsMarket[] = [
    "FT Result",
    "Over/Under 2.5",
    "BTTS",
  ];

  return (
    <div className="flex items-center gap-3 px-3 py-2 border-b bg-card/20 flex-wrap">
      {/* Market selector */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider mr-1">
          Market
        </span>
        {availableMarkets.map((m) => (
          <button
            key={m}
            onClick={() => onMarketChange(m)}
            className={cn(
              "px-2 py-0.5 text-xs rounded-full border transition-colors",
              selectedMarket === m
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="h-4 w-px bg-border mx-1" />

      {/* Arb threshold */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider mr-1">
          Min Arb
        </span>
        {ARB_THRESHOLD_OPTIONS.map((t) => (
          <button
            key={t}
            onClick={() => onThresholdChange(t)}
            className={cn(
              "px-2 py-0.5 text-xs rounded-full border transition-colors tabular-nums",
              arbThreshold === t
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                : "border-border text-muted-foreground hover:text-foreground",
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
}

export function ArbTab({ fixtures }: ArbTabProps) {
  const [selectedMarket, setSelectedMarket] =
    React.useState<OddsMarket>("FT Result");
  const [arbThreshold, setArbThreshold] = React.useState(DEFAULT_ARB_THRESHOLD);

  return (
    <div className="flex flex-col h-full min-h-0">
      <ArbControls
        selectedMarket={selectedMarket}
        onMarketChange={setSelectedMarket}
        arbThreshold={arbThreshold}
        onThresholdChange={setArbThreshold}
      />

      <ResizablePanelGroup
        direction="horizontal"
        autoSaveId="sports-arb-layout"
        className="flex-1 min-h-0"
      >
        {/* Left: Odds grid */}
        <ResizablePanel
          defaultSize={65}
          minSize={40}
          className="flex flex-col min-h-0"
        >
          <div className="px-3 py-1.5 border-b">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Odds Grid — {selectedMarket}
            </span>
          </div>
          <div className="flex-1 overflow-auto">
            <ArbGrid
              fixtures={fixtures}
              selectedMarket={selectedMarket}
              arbThreshold={arbThreshold}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right: Arb stream */}
        <ResizablePanel
          defaultSize={35}
          minSize={25}
          className="flex flex-col min-h-0 border-l"
        >
          <div className="px-3 py-1.5 border-b">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Arb Stream
            </span>
          </div>
          <div className="flex-1 min-h-0 overflow-auto">
            <ArbStream arbThreshold={arbThreshold} />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
