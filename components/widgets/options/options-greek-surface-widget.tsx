"use client";

import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { GreeksSurfacePanel, TradFiVolSurfacePanel } from "@/components/trading/options-futures-panel";
import { useOptionsData } from "./options-data-context";

export function OptionsGreekSurfaceWidget(_props: WidgetComponentProps) {
  const { isCrypto, asset, tradFiAsset } = useOptionsData();
  if (!isCrypto) {
    return <TradFiVolSurfacePanel tradFiAsset={tradFiAsset} />;
  }
  return <GreeksSurfacePanel asset={asset} />;
}
