"use client";

import * as React from "react";
import type { SelectedInstrument } from "@/lib/types/options";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { OptionsChainTab, TradePanel, TradFiOptionsChainTab } from "@/components/trading/options-futures-panel";
import { useOptionsData } from "./options-data-context";

export function OptionsChainWidget(_props: WidgetComponentProps) {
  const { isCrypto, asset, tradFiAsset, optionRows, selectedInstrument, setSelectedFuture, setSelectedInstrument } =
    useOptionsData();

  const onPick = React.useCallback(
    (inst: SelectedInstrument) => {
      setSelectedFuture(null);
      setSelectedInstrument(inst);
    },
    [setSelectedFuture, setSelectedInstrument],
  );

  if (optionRows.length === 0) {
    return (
      <p className="text-xs text-muted-foreground p-3">
        No options contracts available for the selected expiry and asset.
      </p>
    );
  }

  const chain = isCrypto ? (
    <OptionsChainTab asset={asset} onSelectInstrument={onPick} />
  ) : (
    <TradFiOptionsChainTab tradFiAsset={tradFiAsset} onSelectInstrument={onPick} />
  );

  const hasSelection = selectedInstrument !== null && selectedInstrument.type !== "future";

  return (
    <div className="flex flex-row h-full min-h-0 gap-2">
      <div className={hasSelection ? "flex-1 min-w-0 overflow-auto" : "flex-1 min-w-0"}>{chain}</div>
      {hasSelection ? (
        <div className="w-[min(22rem,40%)] shrink-0 border-l pl-2 overflow-auto">
          <TradePanel instrument={selectedInstrument} />
        </div>
      ) : null}
    </div>
  );
}
