"use client";

import * as React from "react";
import type { SelectedInstrument } from "@/lib/types/options";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { FuturesTab } from "@/components/trading/options-futures-panel";
import { useOptionsData } from "./options-data-context";

export function OptionsFuturesTableWidget(_props: WidgetComponentProps) {
  const { isCrypto, asset, futureRows, setSelectedInstrument, setSelectedFuture } = useOptionsData();
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
  return <FuturesTab asset={asset} onSelectInstrument={onPick} />;
}
