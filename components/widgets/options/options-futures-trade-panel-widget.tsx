"use client";

import type { FutureRow, SelectedInstrument } from "@/lib/types/options";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { TradePanel } from "@/components/trading/options-futures-panel";
import { useOptionsData } from "./options-data-context";

function futureRowToInstrument(row: FutureRow): SelectedInstrument {
  return {
    name: row.contract,
    type: "future",
    price: row.markPrice,
  };
}

export function OptionsFuturesTradePanelWidget(_props: WidgetComponentProps) {
  const { selectedFuture } = useOptionsData();
  const instrument = selectedFuture ? futureRowToInstrument(selectedFuture) : null;
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground px-1">
        Select a row in the futures table to populate this panel. Clearing chain selection avoids ambiguity.
      </p>
      <TradePanel instrument={instrument} />
    </div>
  );
}
