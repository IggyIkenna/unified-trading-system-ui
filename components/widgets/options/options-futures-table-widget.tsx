"use client";

import * as React from "react";
import type { FutureRow, SelectedInstrument } from "@/lib/types/options";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { FuturesTab, TradePanel } from "@/components/trading/options-futures-panel";
import { useOptionsData } from "./options-data-context";

function futureRowToInstrument(row: FutureRow): SelectedInstrument {
  return { name: row.contract, type: "future", price: row.markPrice };
}

export function OptionsFuturesTableWidget(_props: WidgetComponentProps) {
  const { isCrypto, asset, futureRows, selectedFuture, setSelectedInstrument, setSelectedFuture } = useOptionsData();
  const onPick = React.useCallback(
    (inst: SelectedInstrument) => {
      setSelectedInstrument(inst);
      if (inst.type === "future") {
        const row = futureRows.find((r) => r.contract === inst.name);
        if (row) setSelectedFuture(row);
      }
    },
    [futureRows, setSelectedFuture, setSelectedInstrument],
  );

  if (!isCrypto) {
    return (
      <p className="text-xs text-muted-foreground p-3">
        Futures contracts are available for crypto underlyings. Switch asset class to Crypto in the control bar.
      </p>
    );
  }
  if (futureRows.length === 0) {
    return <p className="text-xs text-muted-foreground p-3">No futures contracts available for the selected asset.</p>;
  }

  const panelInstrument = selectedFuture ? futureRowToInstrument(selectedFuture) : null;

  return (
    <div className="flex flex-col h-full min-h-0 gap-2">
      <div className="flex-1 min-h-0 overflow-auto">
        <FuturesTab asset={asset} onSelectInstrument={onPick} />
      </div>
      {panelInstrument ? (
        <div className="border-t pt-2 shrink-0 max-h-[45%] overflow-auto">
          <p className="text-xs text-muted-foreground px-1 pb-1">
            Trading {panelInstrument.name} — pick a different row to switch contracts.
          </p>
          <TradePanel instrument={panelInstrument} />
        </div>
      ) : null}
    </div>
  );
}
