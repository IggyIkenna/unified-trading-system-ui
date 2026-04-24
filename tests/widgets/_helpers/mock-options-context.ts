import { vi } from "vitest";
import type {
  Asset,
  TradFiAsset,
  AssetClass,
  Settlement,
  Market,
  TradFiMarket,
  MainTab,
  TradeDirection,
  OrderType,
  GreekSurface,
  StrategiesMode,
  ComboType,
  FutureRow,
  OptionRow,
} from "@/lib/types/options";

/**
 * Minimal mock for OptionsDataContextValue fields consumed by widget harnesses.
 *
 * Real context is richer; keep this surface minimal so tests don't break when
 * unrelated OptionsDataContextValue fields are added.
 *
 * Used by:
 *   tests/widgets/options/futures-table.test.tsx
 *   tests/widgets/options/options-chain.test.tsx
 *   tests/widgets/options/options-control-bar.test.tsx
 *   tests/widgets/options/options-greek-surface.test.tsx
 *   tests/widgets/options/options-strategies.test.tsx
 *   tests/widgets/options/options-watchlist.test.tsx
 */

export interface MockOptionRow extends OptionRow {}

export interface MockFutureRow extends FutureRow {}

export function buildMockOptionRow(overrides: Partial<MockOptionRow> = {}): MockOptionRow {
  return {
    strike: 70000,
    callBid: 1200,
    callAsk: 1250,
    callMark: 1225,
    callIvBid: 52.1,
    callIvAsk: 53.4,
    callDelta: 0.52,
    callOi: 4800,
    callSize: 12,
    putBid: 800,
    putAsk: 850,
    putMark: 825,
    putIvBid: 50.8,
    putIvAsk: 52.1,
    putDelta: -0.48,
    putOi: 3200,
    putSize: 8,
    ...overrides,
  };
}

export function buildMockFutureRow(overrides: Partial<MockFutureRow> = {}): MockFutureRow {
  return {
    contract: "BTC-PERPETUAL",
    asset: "BTC",
    settlement: "inverse",
    markPrice: 71583,
    change24h: 2.41,
    volume24h: 2_400_000_000,
    openInterest: 8_700_000_000,
    fundingRate: 0.0001,
    basis: 0.15,
    isPerpetual: true,
    favourite: false,
    ...overrides,
  };
}

export interface MockWatchlistSymbol {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  iv?: number;
  category?: string;
}

export function buildMockWatchlistSymbol(overrides: Partial<MockWatchlistSymbol> = {}): MockWatchlistSymbol {
  return {
    id: "btc",
    symbol: "BTC",
    name: "Bitcoin",
    price: 71583,
    change24h: 2.41,
    iv: 50.9,
    category: "crypto",
    ...overrides,
  };
}

export interface MockWatchlistDefinition {
  id: string;
  label: string;
  symbols: MockWatchlistSymbol[];
}

export function buildMockWatchlist(overrides: Partial<MockWatchlistDefinition> = {}): MockWatchlistDefinition {
  return {
    id: "crypto-top",
    label: "Crypto Top",
    symbols: [buildMockWatchlistSymbol()],
    ...overrides,
  };
}

export interface MockOptionsDataOverrides {
  assetClass?: AssetClass;
  asset?: Asset;
  tradFiAsset?: TradFiAsset;
  settlement?: Settlement;
  market?: Market;
  tradFiMarket?: TradFiMarket;
  isCrypto?: boolean;
  optionRows?: MockOptionRow[];
  futureRows?: MockFutureRow[];
  watchlists?: MockWatchlistDefinition[];
  watchlistId?: string;
  selectedWatchlistSymbolId?: string;
  activeTab?: MainTab;
  showWatchlist?: boolean;
  strategiesMode?: StrategiesMode;
  comboType?: ComboType;
  tradeDirection?: TradeDirection;
  orderType?: OrderType;
  orderQty?: string;
  orderPrice?: string;
  greekSurface?: GreekSurface | null;
  isLoading?: boolean;
  error?: string | null;
  handleSubmitOrder?: ReturnType<typeof vi.fn>;
  setSelectedInstrument?: ReturnType<typeof vi.fn>;
  setSelectedFuture?: ReturnType<typeof vi.fn>;
  setAssetClass?: ReturnType<typeof vi.fn>;
  setStrategiesMode?: ReturnType<typeof vi.fn>;
  setActiveTab?: ReturnType<typeof vi.fn>;
}

/**
 * Returns a minimal mock value for useOptionsData().
 * Use with vi.mock('@/components/widgets/options/options-data-context', ...).
 */
export function buildMockOptionsData(overrides: MockOptionsDataOverrides = {}) {
  const assetClass: AssetClass = overrides.assetClass ?? "crypto";
  const isCrypto = overrides.isCrypto !== undefined ? overrides.isCrypto : assetClass === "crypto";
  const optionRows = overrides.optionRows ?? [buildMockOptionRow()];
  const futureRows = overrides.futureRows ?? [buildMockFutureRow()];
  const watchlists = overrides.watchlists ?? [buildMockWatchlist()];

  return {
    assetClass,
    asset: overrides.asset ?? ("BTC" as Asset),
    tradFiAsset: overrides.tradFiAsset ?? ("SPY" as TradFiAsset),
    settlement: overrides.settlement ?? ("inverse" as Settlement),
    market: overrides.market ?? ("deribit" as Market),
    tradFiMarket: overrides.tradFiMarket ?? ("cboe" as TradFiMarket),
    expiry: "26 JUN 26",
    setAssetClass: overrides.setAssetClass ?? vi.fn(),
    setAsset: vi.fn(),
    setTradFiAsset: vi.fn(),
    setSettlement: vi.fn(),
    setMarket: vi.fn(),
    setTradFiMarket: vi.fn(),
    setExpiry: vi.fn(),

    optionRows,
    spotPrice: 71583,
    activeStrike: null,
    setActiveStrike: vi.fn(),
    greekSurface: overrides.greekSurface ?? null,
    setGreekSurface: vi.fn(),

    futureRows,
    selectedFuture: null,
    setSelectedFuture: overrides.setSelectedFuture ?? vi.fn(),

    strategiesMode: overrides.strategiesMode ?? ("futures-spreads" as StrategiesMode),
    setStrategiesMode: overrides.setStrategiesMode ?? vi.fn(),
    comboType: overrides.comboType ?? ("vertical-spread" as ComboType),
    setComboType: vi.fn(),
    comboLegs: [],
    comboNetCost: 0,
    comboMaxProfit: 0,
    comboMaxLoss: 0,

    scenarioIvShift: 0,
    setScenarioIvShift: vi.fn(),
    scenarioPriceRange: [0.85, 1.15] as [number, number],
    setScenarioPriceRange: vi.fn(),
    scenarioDte: 30,
    setScenarioDte: vi.fn(),
    payoffData: [
      { price: 60845, pnl: -120000 },
      { price: 71583, pnl: 0 },
      { price: 82320, pnl: 100000 },
    ],

    watchlists,
    selectedSymbol: watchlists[0]?.symbols[0] ?? null,
    setSelectedSymbol: vi.fn(),

    tradeDirection: overrides.tradeDirection ?? ("buy" as TradeDirection),
    setTradeDirection: vi.fn(),
    orderType: overrides.orderType ?? ("limit" as OrderType),
    setOrderType: vi.fn(),
    orderQty: overrides.orderQty ?? "",
    setOrderQty: vi.fn(),
    orderPrice: overrides.orderPrice ?? "",
    setOrderPrice: vi.fn(),
    handleSubmitOrder: overrides.handleSubmitOrder ?? vi.fn(),

    activeTab: overrides.activeTab ?? ("options" as MainTab),
    setActiveTab: overrides.setActiveTab ?? vi.fn(),
    showWatchlist: overrides.showWatchlist ?? true,
    setShowWatchlist: vi.fn(),
    watchlistId: overrides.watchlistId ?? "crypto-top",
    setWatchlistId: vi.fn(),
    selectedWatchlistSymbolId: overrides.selectedWatchlistSymbolId ?? "btc",
    setSelectedWatchlistSymbolId: vi.fn(),
    pinnedCryptoAssets: ["BTC", "ETH", "SOL", "AVAX"] as Asset[],
    setPinnedCryptoAssets: vi.fn(),
    pinnedTradFiAssets: ["SPY", "QQQ", "SPX"] as TradFiAsset[],
    setPinnedTradFiAssets: vi.fn(),
    selectedInstrument: null,
    setSelectedInstrument: overrides.setSelectedInstrument ?? vi.fn(),

    handleAssetClassChange: overrides.setAssetClass ?? vi.fn(),
    handleWatchlistSelect: vi.fn(),
    isCrypto,
    mode: "live",

    isLoading: overrides.isLoading ?? false,
    error: overrides.error ?? null,
  };
}
