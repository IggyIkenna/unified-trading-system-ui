"use client";

import * as React from "react";
import { useExecutionMode } from "@/lib/execution-mode-context";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import type { WatchlistSymbol } from "@/components/trading/watchlist-panel";
import type {
  Asset,
  AssetClass,
  ComboLeg,
  ComboType,
  FutureRow,
  GreekSurface,
  MainTab,
  Market,
  OptionRow,
  OrderType,
  SelectedInstrument,
  Settlement,
  StrategiesMode,
  TradFiAsset,
  TradFiMarket,
  TradeDirection,
} from "@/lib/types/options";
import {
  ASSETS,
  DEFAULT_WATCHLISTS,
  TRADFI_ASSETS,
  generateFuturesData,
  generateOptionChain,
  generateTradFiOptionChain,
  SPOT_PRICES,
  TRADFI_SPOT_PRICES,
} from "@/lib/mocks/fixtures/options-futures-mock";
import { placeMockOrder } from "@/lib/api/mock-trade-ledger";
import { toast } from "@/hooks/use-toast";

export interface OptionsDataContextValue {
  assetClass: AssetClass;
  asset: Asset;
  tradFiAsset: TradFiAsset;
  settlement: Settlement;
  market: Market;
  tradFiMarket: TradFiMarket;
  expiry: string;
  setAssetClass: (ac: AssetClass) => void;
  setAsset: (a: Asset) => void;
  setTradFiAsset: (a: TradFiAsset) => void;
  setSettlement: (s: Settlement) => void;
  setMarket: (m: Market) => void;
  setTradFiMarket: (m: TradFiMarket) => void;
  setExpiry: (e: string) => void;

  optionRows: OptionRow[];
  spotPrice: number;
  activeStrike: number | null;
  setActiveStrike: (s: number | null) => void;
  greekSurface: GreekSurface | null;
  setGreekSurface: (g: GreekSurface | null) => void;

  futureRows: FutureRow[];
  selectedFuture: FutureRow | null;
  setSelectedFuture: (f: FutureRow | null) => void;

  strategiesMode: StrategiesMode;
  setStrategiesMode: (m: StrategiesMode) => void;
  comboType: ComboType;
  setComboType: (c: ComboType) => void;
  comboLegs: ComboLeg[];
  comboNetCost: number;
  comboMaxProfit: number;
  comboMaxLoss: number;

  scenarioIvShift: number;
  setScenarioIvShift: (n: number) => void;
  scenarioPriceRange: [number, number];
  setScenarioPriceRange: (r: [number, number]) => void;
  scenarioDte: number;
  setScenarioDte: (n: number) => void;
  payoffData: Array<{ price: number; pnl: number }>;

  watchlists: typeof DEFAULT_WATCHLISTS;
  selectedSymbol: WatchlistSymbol | null;
  setSelectedSymbol: (s: WatchlistSymbol | null) => void;

  tradeDirection: TradeDirection;
  setTradeDirection: (d: TradeDirection) => void;
  orderType: OrderType;
  setOrderType: (t: OrderType) => void;
  orderQty: string;
  setOrderQty: (q: string) => void;
  orderPrice: string;
  setOrderPrice: (p: string) => void;
  handleSubmitOrder: () => void;

  activeTab: MainTab;
  setActiveTab: (t: MainTab) => void;
  showWatchlist: boolean;
  setShowWatchlist: (v: boolean) => void;
  watchlistId: string;
  setWatchlistId: (id: string) => void;
  selectedWatchlistSymbolId: string;
  setSelectedWatchlistSymbolId: (id: string) => void;
  pinnedCryptoAssets: Asset[];
  setPinnedCryptoAssets: (a: Asset[]) => void;
  pinnedTradFiAssets: TradFiAsset[];
  setPinnedTradFiAssets: (a: TradFiAsset[]) => void;
  selectedInstrument: SelectedInstrument | null;
  setSelectedInstrument: (i: SelectedInstrument | null) => void;

  handleAssetClassChange: (ac: AssetClass) => void;
  handleWatchlistSelect: (sym: WatchlistSymbol) => void;
  isCrypto: boolean;
  mode?: string;
}

const OptionsDataContext = React.createContext<OptionsDataContextValue | null>(null);

function findSymbolById(id: string): WatchlistSymbol | null {
  for (const wl of DEFAULT_WATCHLISTS) {
    const sym = wl.symbols.find((s) => s.id === id);
    if (sym) return sym;
  }
  return null;
}

export function OptionsDataProvider({ children }: { children: React.ReactNode }) {
  const { mode } = useExecutionMode();
  const { scope: globalScope } = useGlobalScope();
  const [assetClass, setAssetClass] = React.useState<AssetClass>("crypto");
  const isCrypto = assetClass === "crypto";

  const [asset, setAsset] = React.useState<Asset>("BTC");
  const [settlement, setSettlement] = React.useState<Settlement>("inverse");
  const [market, setMarket] = React.useState<Market>("deribit");
  const [tradFiAsset, setTradFiAsset] = React.useState<TradFiAsset>("SPY");
  const [tradFiMarket, setTradFiMarket] = React.useState<TradFiMarket>("cboe");

  const [expiry, setExpiry] = React.useState("26 JUN 26");

  const [selectedInstrument, setSelectedInstrument] = React.useState<SelectedInstrument | null>(null);
  const [activeTab, setActiveTab] = React.useState<MainTab>("options");
  const [strategiesMode, setStrategiesMode] = React.useState<StrategiesMode>("futures-spreads");
  const [showWatchlist, setShowWatchlist] = React.useState(true);
  const [watchlistId, setWatchlistId] = React.useState("crypto-top");
  const [selectedWatchlistSymbolId, setSelectedWatchlistSymbolId] = React.useState("btc");

  const [pinnedCryptoAssets, setPinnedCryptoAssets] = React.useState<Asset[]>(["BTC", "ETH", "SOL", "AVAX"]);
  const [pinnedTradFiAssets, setPinnedTradFiAssets] = React.useState<TradFiAsset[]>(["SPY", "QQQ", "SPX"]);

  const [activeStrike, setActiveStrike] = React.useState<number | null>(null);
  const [greekSurface, setGreekSurface] = React.useState<GreekSurface | null>(null);
  const [selectedFuture, setSelectedFuture] = React.useState<FutureRow | null>(null);

  const [comboType, setComboType] = React.useState<ComboType>("vertical-spread");

  const [scenarioIvShift, setScenarioIvShift] = React.useState(0);
  const [scenarioPriceRange, setScenarioPriceRange] = React.useState<[number, number]>([0.85, 1.15]);
  const [scenarioDte, setScenarioDte] = React.useState(30);

  const [tradeDirection, setTradeDirection] = React.useState<TradeDirection>("buy");
  const [orderType, setOrderType] = React.useState<OrderType>("limit");
  const [orderQty, setOrderQty] = React.useState("");
  const [orderPrice, setOrderPrice] = React.useState("");

  const handleAssetClassChange = React.useCallback((ac: AssetClass) => {
    setAssetClass(ac);
    if (ac === "tradfi") {
      setActiveTab((t) => (t === "futures" ? "options" : t));
      setWatchlistId("tradfi-us");
    } else {
      setWatchlistId("crypto-top");
    }
  }, []);

  const handleWatchlistSelect = React.useCallback(
    (sym: WatchlistSymbol) => {
      setSelectedWatchlistSymbolId(sym.id);
      if (isCrypto) {
        const a = ASSETS.find((x) => x === sym.symbol);
        if (a) setAsset(a);
      } else {
        const a = TRADFI_ASSETS.find((x) => x === sym.symbol);
        if (a) setTradFiAsset(a);
      }
    },
    [isCrypto],
  );

  React.useEffect(() => {
    const id = isCrypto ? asset.toLowerCase() : tradFiAsset.toLowerCase();
    setSelectedWatchlistSymbolId(id);
  }, [asset, tradFiAsset, isCrypto]);

  const spotPrice = isCrypto ? SPOT_PRICES[asset] : TRADFI_SPOT_PRICES[tradFiAsset];

  const optionRows = React.useMemo<OptionRow[]>(() => {
    if (isCrypto) return generateOptionChain(asset, expiry);
    return generateTradFiOptionChain(tradFiAsset, expiry);
  }, [isCrypto, asset, tradFiAsset, expiry]);

  const futureRows = React.useMemo<FutureRow[]>(() => {
    if (!isCrypto) return [];
    return generateFuturesData(asset);
  }, [isCrypto, asset]);

  const comboLegs = selectedInstrument?.type === "combo" ? (selectedInstrument.legs ?? []) : [];
  const comboNetCost = selectedInstrument?.type === "combo" ? Math.abs(selectedInstrument.netDebit ?? 0) : 0;
  const comboMaxProfit = comboLegs.length > 0 ? comboNetCost * 4 : 0;
  const comboMaxLoss = comboLegs.length > 0 ? -comboNetCost * 2 : 0;

  const payoffData = React.useMemo(() => {
    const [lo, hi] = scenarioPriceRange;
    const low = spotPrice * lo;
    const high = spotPrice * hi;
    const steps = 24;
    const out: Array<{ price: number; pnl: number }> = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const price = low + (high - low) * t;
      const d = (price - spotPrice) / spotPrice;
      const pnl = d * 1_000_000 * 0.4 + scenarioIvShift * 8_000 - scenarioDte * 1_200;
      out.push({ price, pnl });
    }
    return out;
  }, [spotPrice, scenarioPriceRange, scenarioIvShift, scenarioDte]);

  const selectedSymbol = React.useMemo(() => findSymbolById(selectedWatchlistSymbolId), [selectedWatchlistSymbolId]);

  const setSelectedSymbol = React.useCallback(
    (s: WatchlistSymbol | null) => {
      if (!s) return;
      handleWatchlistSelect(s);
    },
    [handleWatchlistSelect],
  );

  const handleSubmitOrder = React.useCallback(() => {
    if (!selectedInstrument) {
      toast({
        title: "No instrument",
        description: "Select from chain, futures, or strategies.",
        variant: "destructive",
      });
      return;
    }
    const qty = parseFloat(orderQty) || 0;
    if (qty <= 0) {
      toast({ title: "Invalid size", description: "Enter quantity.", variant: "destructive" });
      return;
    }
    const price = parseFloat(orderPrice) || selectedInstrument.price;
    const order = placeMockOrder({
      client_id: "internal-trader",
      instrument_id: selectedInstrument.name,
      venue: "Deribit",
      side: tradeDirection,
      order_type: orderType === "market" ? "market" : "limit",
      quantity: qty,
      price,
      asset_class: "CeFi",
      lane: "options",
    });
    toast({ title: "Order submitted", description: `${selectedInstrument.name} (${order.id})` });
    setOrderQty("");
  }, [selectedInstrument, orderQty, orderPrice, tradeDirection, orderType]);

  React.useEffect(() => {
    if (selectedInstrument) setOrderPrice(selectedInstrument.price.toFixed(2));
  }, [selectedInstrument]);

  const scopedWatchlists = React.useMemo(
    () =>
      globalScope.organizationIds.length > 0 && !globalScope.organizationIds.includes("odum")
        ? DEFAULT_WATCHLISTS.filter((wl) => wl.id.startsWith("crypto"))
        : DEFAULT_WATCHLISTS,
    [globalScope.organizationIds],
  );

  const value: OptionsDataContextValue = React.useMemo(
    () => ({
      assetClass,
      asset,
      tradFiAsset,
      settlement,
      market,
      tradFiMarket,
      expiry,
      setAssetClass: handleAssetClassChange,
      setAsset,
      setTradFiAsset,
      setSettlement,
      setMarket,
      setTradFiMarket,
      setExpiry,

      optionRows,
      spotPrice,
      activeStrike,
      setActiveStrike,
      greekSurface,
      setGreekSurface,

      futureRows,
      selectedFuture,
      setSelectedFuture,

      strategiesMode,
      setStrategiesMode,
      comboType,
      setComboType,
      comboLegs,
      comboNetCost,
      comboMaxProfit,
      comboMaxLoss,

      scenarioIvShift,
      setScenarioIvShift,
      scenarioPriceRange,
      setScenarioPriceRange,
      scenarioDte,
      setScenarioDte,
      payoffData,

      watchlists: scopedWatchlists,
      selectedSymbol,
      setSelectedSymbol,

      tradeDirection,
      setTradeDirection,
      orderType,
      setOrderType,
      orderQty,
      setOrderQty,
      orderPrice,
      setOrderPrice,
      handleSubmitOrder,

      activeTab,
      setActiveTab,
      showWatchlist,
      setShowWatchlist,
      watchlistId,
      setWatchlistId,
      selectedWatchlistSymbolId,
      setSelectedWatchlistSymbolId,
      pinnedCryptoAssets,
      setPinnedCryptoAssets,
      pinnedTradFiAssets,
      setPinnedTradFiAssets,
      selectedInstrument,
      setSelectedInstrument,

      handleAssetClassChange,
      handleWatchlistSelect,
      isCrypto,
      mode,
    }),
    [
      assetClass,
      asset,
      tradFiAsset,
      settlement,
      market,
      tradFiMarket,
      expiry,
      handleAssetClassChange,
      optionRows,
      spotPrice,
      activeStrike,
      greekSurface,
      futureRows,
      selectedFuture,
      strategiesMode,
      comboType,
      comboLegs,
      comboNetCost,
      comboMaxProfit,
      comboMaxLoss,
      scenarioIvShift,
      scenarioPriceRange,
      scenarioDte,
      payoffData,
      scopedWatchlists,
      selectedSymbol,
      setSelectedSymbol,
      tradeDirection,
      orderType,
      orderQty,
      orderPrice,
      handleSubmitOrder,
      activeTab,
      showWatchlist,
      watchlistId,
      selectedWatchlistSymbolId,
      pinnedCryptoAssets,
      pinnedTradFiAssets,
      selectedInstrument,
      handleWatchlistSelect,
      isCrypto,
      mode,
    ],
  );

  return <OptionsDataContext.Provider value={value}>{children}</OptionsDataContext.Provider>;
}

export function useOptionsData(): OptionsDataContextValue {
  const ctx = React.useContext(OptionsDataContext);
  if (!ctx) throw new Error("useOptionsData must be used within OptionsDataProvider");
  return ctx;
}
