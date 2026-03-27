"use client";

import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { OptionsToolbar } from "@/components/trading/options-futures-panel";
import { useOptionsData } from "./options-data-context";

export function OptionsControlBarWidget(_props: WidgetComponentProps) {
  const ctx = useOptionsData();
  return (
    <OptionsToolbar
      assetClass={ctx.assetClass}
      setAssetClass={ctx.setAssetClass}
      asset={ctx.asset}
      setAsset={ctx.setAsset}
      tradFiAsset={ctx.tradFiAsset}
      setTradFiAsset={ctx.setTradFiAsset}
      pinnedCryptoAssets={ctx.pinnedCryptoAssets}
      setPinnedCryptoAssets={ctx.setPinnedCryptoAssets}
      pinnedTradFiAssets={ctx.pinnedTradFiAssets}
      setPinnedTradFiAssets={ctx.setPinnedTradFiAssets}
      settlement={ctx.settlement}
      setSettlement={ctx.setSettlement}
      market={ctx.market}
      setMarket={ctx.setMarket}
      tradFiMarket={ctx.tradFiMarket}
      setTradFiMarket={ctx.setTradFiMarket}
      activeTab={ctx.activeTab}
      setActiveTab={ctx.setActiveTab}
      showWatchlist={ctx.showWatchlist}
      setShowWatchlist={ctx.setShowWatchlist}
    />
  );
}
