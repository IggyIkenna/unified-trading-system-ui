"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { WatchlistPanel, type WatchlistSymbol } from "@/components/trading/watchlist-panel";
import type {
  AssetClass,
  Asset,
  TradFiAsset,
  Settlement,
  Market,
  TradFiMarket,
  MainTab,
  SelectedInstrument,
  StrategiesMode,
} from "@/lib/types/options";
import { ASSETS, TRADFI_ASSETS, DEFAULT_WATCHLISTS } from "@/lib/mocks/fixtures/options-futures-mock";

import { OptionsToolbar } from "./options-toolbar";
import { OptionsChainTab } from "./options-chain-tab";
import { TradFiOptionsChainTab } from "./tradfi-options-chain-tab";
import { VolSurfacePanel, GreeksSurfacePanel } from "./vol-greeks-panels";
import { TradFiVolSurfacePanel } from "./tradfi-vol-surface-panel";
import { FuturesTab } from "./futures-tab";
import { FuturesSpreadsTab } from "./futures-spreads-tab";
import { OptionsCombosPanel } from "./options-combos-panel";
import { ScenarioTab } from "./scenario-tab";
import { TradePanel } from "./trade-panel";

// ---------- Main Component ----------

interface OptionsFuturesPanelProps {
  className?: string;
}

export function OptionsFuturesPanel({ className }: OptionsFuturesPanelProps) {
  // Asset-class state
  const [assetClass, setAssetClass] = React.useState<AssetClass>("crypto");
  const isCrypto = assetClass === "crypto";

  // Crypto instrument state
  const [asset, setAsset] = React.useState<Asset>("BTC");
  const [settlement, setSettlement] = React.useState<Settlement>("inverse");
  const [market, setMarket] = React.useState<Market>("deribit");

  // TradFi instrument state
  const [tradFiAsset, setTradFiAsset] = React.useState<TradFiAsset>("SPY");
  const [tradFiMarket, setTradFiMarket] = React.useState<TradFiMarket>("cboe");

  // UI state
  const [selectedInstrument, setSelectedInstrument] = React.useState<SelectedInstrument | null>(null);
  const [activeTab, setActiveTab] = React.useState<MainTab>("options");
  const [strategiesMode, setStrategiesMode] = React.useState<StrategiesMode>("futures-spreads");
  const [showWatchlist, setShowWatchlist] = React.useState(true);
  const [watchlistId, setWatchlistId] = React.useState("crypto-top");
  const [selectedWatchlistSymbolId, setSelectedWatchlistSymbolId] = React.useState<string>("btc");

  // Pinned asset pills (up to 5, user-configurable)
  const [pinnedCryptoAssets, setPinnedCryptoAssets] = React.useState<Asset[]>(["BTC", "ETH", "SOL", "AVAX"]);
  const [pinnedTradFiAssets, setPinnedTradFiAssets] = React.useState<TradFiAsset[]>(["SPY", "QQQ", "SPX"]);

  // When switching asset class, swap to the relevant default watchlist and reset tab
  function handleAssetClassChange(ac: AssetClass) {
    setAssetClass(ac);
    if (ac === "tradfi") {
      if (activeTab === "futures") setActiveTab("options");
      setWatchlistId("tradfi-us");
    } else {
      setWatchlistId("crypto-top");
    }
  }

  // Selecting a symbol from the watchlist drives the active underlying
  function handleWatchlistSelect(sym: WatchlistSymbol) {
    setSelectedWatchlistSymbolId(sym.id);
    if (isCrypto) {
      const a = ASSETS.find((x) => x === sym.symbol);
      if (a) setAsset(a);
    } else {
      const a = TRADFI_ASSETS.find((x) => x === sym.symbol);
      if (a) setTradFiAsset(a);
    }
  }

  // Keep watchlist selection in sync when asset pills change
  React.useEffect(() => {
    const id = isCrypto ? asset.toLowerCase() : tradFiAsset.toLowerCase();
    setSelectedWatchlistSymbolId(id);
  }, [asset, tradFiAsset, isCrypto]);

  return (
    <div className={cn("flex flex-col h-full overflow-hidden rounded-lg border bg-background", className)}>
      {/* ── Single toolbar row ── */}
      <OptionsToolbar
        assetClass={assetClass}
        setAssetClass={handleAssetClassChange}
        asset={asset}
        setAsset={setAsset}
        tradFiAsset={tradFiAsset}
        setTradFiAsset={setTradFiAsset}
        pinnedCryptoAssets={pinnedCryptoAssets}
        setPinnedCryptoAssets={setPinnedCryptoAssets}
        pinnedTradFiAssets={pinnedTradFiAssets}
        setPinnedTradFiAssets={setPinnedTradFiAssets}
        settlement={settlement}
        setSettlement={setSettlement}
        market={market}
        setMarket={setMarket}
        tradFiMarket={tradFiMarket}
        setTradFiMarket={setTradFiMarket}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        showWatchlist={showWatchlist}
        setShowWatchlist={setShowWatchlist}
      />

      {/* ── Three-column body ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* LEFT — Watchlist */}
        {showWatchlist && (
          <div className="w-[190px] shrink-0 overflow-hidden">
            <WatchlistPanel
              watchlists={DEFAULT_WATCHLISTS}
              activeListId={watchlistId}
              onListChange={setWatchlistId}
              selectedSymbolId={selectedWatchlistSymbolId}
              onSelectSymbol={handleWatchlistSelect}
              editable
              className="h-full"
            />
          </div>
        )}

        {/* CENTRE — Main content */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="p-3 space-y-3">
            {/* Tab content */}
            {activeTab === "options" && (
              <>
                {isCrypto ? (
                  <OptionsChainTab asset={asset} onSelectInstrument={setSelectedInstrument} />
                ) : (
                  <TradFiOptionsChainTab tradFiAsset={tradFiAsset} onSelectInstrument={setSelectedInstrument} />
                )}
                <div className="space-y-1">
                  {isCrypto ? (
                    <>
                      <VolSurfacePanel asset={asset} />
                      <GreeksSurfacePanel asset={asset} />
                    </>
                  ) : (
                    <TradFiVolSurfacePanel tradFiAsset={tradFiAsset} />
                  )}
                </div>
              </>
            )}

            {activeTab === "futures" && isCrypto && (
              <FuturesTab asset={asset} onSelectInstrument={setSelectedInstrument} />
            )}

            {activeTab === "strategies" && (
              <div className="space-y-3">
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
                  <FuturesSpreadsTab onSelectInstrument={setSelectedInstrument} />
                ) : (
                  <OptionsCombosPanel asset={asset} onSelectInstrument={setSelectedInstrument} />
                )}
              </div>
            )}

            {activeTab === "scenario" && (
              <ScenarioTab assetClass={assetClass} asset={asset} tradFiAsset={tradFiAsset} />
            )}
          </div>
        </div>

        {/* RIGHT — Trade panel (hidden on Scenario tab) */}
        {activeTab !== "scenario" && (
          <div className="w-64 shrink-0 border-l overflow-y-auto">
            <div className="p-3">
              <TradePanel instrument={selectedInstrument} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
