"use client";

import * as React from "react";
import type { SelectedInstrument } from "@/lib/types/options";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { OptionsChainTab, TradFiOptionsChainTab } from "@/components/trading/options-futures-panel";
import { useOptionsData } from "./options-data-context";

export function OptionsChainWidget(_props: WidgetComponentProps) {
  const { isCrypto, asset, tradFiAsset, setSelectedFuture, setSelectedInstrument } = useOptionsData();
  const onPick = React.useCallback(
    (inst: SelectedInstrument) => {
      setSelectedFuture(null);
      setSelectedInstrument(inst);
    },
    [setSelectedFuture, setSelectedInstrument],
  );
  if (isCrypto) {
    return <OptionsChainTab asset={asset} onSelectInstrument={onPick} />;
  }
  return <TradFiOptionsChainTab tradFiAsset={tradFiAsset} onSelectInstrument={onPick} />;
}
