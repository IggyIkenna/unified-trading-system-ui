"use client";

import { OptionsFuturesPanel } from "@/components/trading/options-futures-panel";

export default function OptionsFuturesPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Options & Futures</h1>
          <p className="text-sm text-muted-foreground">
            Options chains, futures contracts, vol surface, and multi-leg
            strategies
          </p>
        </div>
      </div>
      <OptionsFuturesPanel />
    </div>
  );
}
