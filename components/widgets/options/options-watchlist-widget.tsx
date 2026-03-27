"use client";

import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { WatchlistPanel } from "@/components/trading/watchlist-panel";
import { useOptionsData } from "./options-data-context";

export function OptionsWatchlistWidget(_props: WidgetComponentProps) {
  const ctx = useOptionsData();
  return (
    <WatchlistPanel
      watchlists={ctx.watchlists}
      activeListId={ctx.watchlistId}
      onListChange={ctx.setWatchlistId}
      selectedSymbolId={ctx.selectedWatchlistSymbolId}
      onSelectSymbol={ctx.handleWatchlistSelect}
      editable
      className="h-full min-h-[200px]"
    />
  );
}
