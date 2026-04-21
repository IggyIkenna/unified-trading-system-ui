"use client";

import { Button } from "@/components/ui/button";
import { ExecutionModeToggle, ExecutionModeIndicator } from "@/components/trading/execution-mode-toggle";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useStrategiesData } from "./strategies-data-context";

export function StrategiesPageHeader() {
  const { isLoading, isLive, filteredStrategies, groupedStrategies } = useStrategiesData();

  return (
    <div className="shrink-0 border-b border-border px-4 py-3 bg-background/95">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">Strategy Catalogue</h1>
            <ExecutionModeIndicator />
          </div>
          {!isLoading && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {filteredStrategies.length} strategies across {Object.keys(groupedStrategies).length} asset classes
              {isLive ? " — Live execution" : " — Batch reconstruction"}
              <span className="block mt-1.5">
                <span className="text-muted-foreground/80">Multi-widget DeFi verification:</span>{" "}
                <Link className="text-primary hover:underline" href="/services/trading/strategies/carry-basis">
                  Carry-basis
                </Link>
                <span className="mx-1 opacity-50">·</span>
                <Link className="text-primary hover:underline" href="/services/trading/strategies/staked-basis">
                  Staked basis
                </Link>
                <span className="mx-1 opacity-50">·</span>
                <Link className="text-primary hover:underline" href="/services/trading/strategies/grid">
                  Grid strategies
                </Link>
                <span className="mx-1 opacity-50">·</span>
                <Link className="text-primary hover:underline" href="/services/trading/strategies/model-portfolios">
                  Model portfolios
                </Link>
              </span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ExecutionModeToggle showDescription />
          <Button size="sm" className="gap-2">
            <Plus className="size-4" />
            New Strategy
          </Button>
        </div>
      </div>
    </div>
  );
}
