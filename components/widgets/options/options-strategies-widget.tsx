"use client";

import * as React from "react";
import type { SelectedInstrument } from "@/lib/types/options";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { Button } from "@/components/ui/button";
import { FuturesSpreadsTab, OptionsCombosPanel, ScenarioTab } from "@/components/trading/options-futures-panel";
import { useOptionsData } from "./options-data-context";

export function OptionsStrategiesWidget(_props: WidgetComponentProps) {
  const {
    strategiesMode,
    setStrategiesMode,
    isCrypto,
    asset,
    assetClass,
    tradFiAsset,
    setSelectedInstrument,
    setSelectedFuture,
  } = useOptionsData();

  const onPick = React.useCallback(
    (inst: SelectedInstrument) => {
      setSelectedFuture(null);
      setSelectedInstrument(inst);
    },
    [setSelectedFuture, setSelectedInstrument],
  );

  return (
    <div className="flex flex-row h-full min-h-0 gap-2">
      <div className="flex-1 min-w-0 overflow-auto space-y-3 p-1">
        <div className="flex items-center gap-0.5 rounded-md border p-0.5 bg-muted/30 w-fit">
          <Button
            variant={strategiesMode === "futures-spreads" ? "default" : "ghost"}
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => setStrategiesMode("futures-spreads")}
            disabled={!isCrypto}
          >
            Futures Spreads
          </Button>
          <Button
            variant={strategiesMode === "options-combos" ? "default" : "ghost"}
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => setStrategiesMode("options-combos")}
          >
            Options Combos
          </Button>
        </div>
        {strategiesMode === "futures-spreads" && isCrypto ? (
          <FuturesSpreadsTab onSelectInstrument={onPick} />
        ) : (
          <OptionsCombosPanel asset={asset} onSelectInstrument={onPick} />
        )}
      </div>
      <div className="w-[min(26rem,45%)] shrink-0 border-l pl-2 overflow-auto">
        <p className="text-xs text-muted-foreground px-1 pb-1">Scenario payoff</p>
        <ScenarioTab assetClass={assetClass} asset={asset} tradFiAsset={tradFiAsset} />
      </div>
    </div>
  );
}
