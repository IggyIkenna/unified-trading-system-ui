"use client";

import * as React from "react";
import { FilterBar } from "@/components/shared/filter-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { BinaryMarketCard, MultiOutcomeMarketCard } from "@/components/trading/predictions/markets-tab";
import { usePredictionsData } from "./predictions-data-context";

export function PredMarketsGridWidget(_props: WidgetComponentProps) {
  const {
    filteredMarkets,
    setSelectedMarketId,
    marketsFilterDefs,
    marketsFilterValues,
    handleMarketsFilterChange,
    resetMarketsFilters,
  } = usePredictionsData();

  // PredictionsDataContext is synchronous (mock) — isLoading is always false.
  // When the context adds isLoading + error fields, wire them here.
  const isLoading = false;
  const error: string | null = null;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-xs text-muted-foreground">Loading markets…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-xs text-rose-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-full min-h-0 overflow-auto">
      <FilterBar
        filters={marketsFilterDefs}
        values={marketsFilterValues as Record<string, string | undefined>}
        onChange={handleMarketsFilterChange}
        onReset={resetMarketsFilters}
        className="border-b-0 px-1 py-1 shrink-0"
      />
      <p className="text-xs text-muted-foreground shrink-0">
        {filteredMarkets.length} market{filteredMarkets.length !== 1 ? "s" : ""}
      </p>
      {filteredMarkets.length === 0 ? (
        <Card className="bg-card border-border/50 shrink-0">
          <CardContent className="py-12 text-center">
            <Search className="size-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No markets found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your filters or search query</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 min-h-0">
          {filteredMarkets.map((market) =>
            market.type === "binary" ? (
              <BinaryMarketCard key={market.id} market={market} onSelect={setSelectedMarketId} />
            ) : (
              <MultiOutcomeMarketCard key={market.id} market={market} onSelect={setSelectedMarketId} />
            ),
          )}
        </div>
      )}
    </div>
  );
}
