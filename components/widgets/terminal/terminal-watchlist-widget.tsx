"use client";

import * as React from "react";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { WatchlistPanel, type WatchlistDefinition, type WatchlistSymbol } from "@/components/trading/watchlist-panel";
import { useTerminalData } from "./terminal-data-context";

export function TerminalWatchlistWidget(_props: WidgetComponentProps) {
  const { instrumentsByCategory, selectedInstrument, setSelectedInstrument } = useTerminalData();

  const watchlists = React.useMemo<WatchlistDefinition[]>(
    () =>
      Object.entries(instrumentsByCategory).map(([category, instruments]) => ({
        id: category,
        label: category,
        symbols: instruments.map<WatchlistSymbol>((inst) => ({
          id: inst.instrumentKey,
          symbol: inst.symbol,
          name: inst.name,
          price: inst.midPrice,
          change24h: inst.change,
          category: inst.venue,
        })),
      })),
    [instrumentsByCategory],
  );

  const [activeListId, setActiveListId] = React.useState(selectedInstrument.category);
  React.useEffect(() => {
    setActiveListId(selectedInstrument.category);
  }, [selectedInstrument.category]);

  const onSelectSymbol = React.useCallback(
    (sym: WatchlistSymbol) => {
      for (const list of Object.values(instrumentsByCategory)) {
        const inst = list.find((i) => i.instrumentKey === sym.id);
        if (inst) {
          setSelectedInstrument(inst);
          return;
        }
      }
    },
    [instrumentsByCategory, setSelectedInstrument],
  );

  return (
    <WatchlistPanel
      watchlists={watchlists}
      activeListId={activeListId}
      onListChange={setActiveListId}
      selectedSymbolId={selectedInstrument.instrumentKey}
      onSelectSymbol={onSelectSymbol}
      className="h-full min-h-[200px]"
    />
  );
}
