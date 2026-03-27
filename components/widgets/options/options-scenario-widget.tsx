"use client";

import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { ScenarioTab } from "@/components/trading/options-futures-panel";
import { useOptionsData } from "./options-data-context";

export function OptionsScenarioWidget(_props: WidgetComponentProps) {
  const { assetClass, asset, tradFiAsset } = useOptionsData();
  return <ScenarioTab assetClass={assetClass} asset={asset} tradFiAsset={tradFiAsset} />;
}
