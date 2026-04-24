import { vi } from "vitest";
import type { BookTrade } from "@/lib/mocks/fixtures/book-trades";

/**
 * Minimal mock for useBookTradeData(). The book widgets read a wide slice of
 * the context; we expose defaults for everything and let tests override the
 * subset they care about via buildMockBookData({...}).
 *
 * Real shape lives in components/widgets/book/book-data-context.tsx — this
 * helper intentionally returns `as never` for fields that TypeScript would
 * otherwise pin to full union types, so tests don't break when the context
 * gains unrelated fields.
 */

export interface MockBookDataOverrides {
  // Scope
  orgId?: string;
  clientId?: string;
  strategyId?: string;
  organizations?: Array<{ id: string; name: string }>;

  // Mode / category
  executionMode?: "execute" | "record_only";
  category?: "cefi_spot" | "cefi_derivatives" | "defi" | "tradfi" | "sports" | "prediction" | "otc";

  // Order form
  venue?: string;
  instrument?: string;
  side?: "buy" | "sell";
  quantity?: string;
  price?: string;
  algo?: "MARKET" | "TWAP" | "VWAP" | "ICEBERG" | "SOR" | "BEST_PRICE" | "BENCHMARK_FILL";

  // DeFi-specific
  isDefiCategory?: boolean;
  defiInstructionType?: string;
  defiAlgo?: string;
  availableDefiAlgos?: string[];
  maxSlippageBps?: number;

  // OTC
  isOtcCategory?: boolean;

  // State
  orderState?: "idle" | "preview" | "submitting" | "success" | "error";
  errorMessage?: string;
  complianceResult?: unknown;
  complianceUnavailable?: boolean;
  complianceLoading?: boolean;
  compliancePassed?: boolean;

  // Derived
  qty?: number;
  priceNum?: number;
  total?: number;
  canPreview?: boolean;
  canExecute?: boolean;

  // Callbacks
  handlePreview?: ReturnType<typeof vi.fn>;
  handleSubmit?: ReturnType<typeof vi.fn>;
  resetForm?: ReturnType<typeof vi.fn>;

  // Trades
  trades?: BookTrade[];

  // User
  user?: { displayName?: string; email?: string; org?: { id: string } } | null;
}

/**
 * Builds a mock BookTradeDataContextValue-shaped object wired for the
 * defaults the book widgets see at first mount (Execute mode, CeFi Spot
 * category, idle order state, canExecute=true trader).
 */
export function buildMockBookData(overrides: MockBookDataOverrides = {}) {
  const categoryLabels = {
    cefi_spot: "CeFi Spot",
    cefi_derivatives: "CeFi Derivatives",
    defi: "DeFi",
    tradfi: "TradFi",
    sports: "Sports",
    prediction: "Prediction",
    otc: "OTC / Bilateral",
  };

  const organizations = overrides.organizations ?? [
    { id: "org-1", name: "Default Org" },
    { id: "org-2", name: "Second Org" },
  ];

  const registryStrategies = [
    {
      id: "strat-live-1",
      name: "Live Momentum",
      assetClass: "CeFi",
      status: "live",
    },
    {
      id: "strat-paper-1",
      name: "Paper Mean Rev",
      assetClass: "DeFi",
      status: "paper",
    },
    {
      id: "strat-draft-1",
      name: "Draft Basis",
      assetClass: "DeFi",
      status: "draft",
    },
  ];

  return {
    // Scope
    orgId: overrides.orgId ?? "",
    setOrgId: vi.fn(),
    clientId: overrides.clientId ?? "",
    setClientId: vi.fn(),
    strategyId: overrides.strategyId ?? "manual",
    setStrategyId: vi.fn(),
    organizations,

    // Mode / category
    executionMode: overrides.executionMode ?? "execute",
    setExecutionMode: vi.fn(),
    category: overrides.category ?? "cefi_spot",
    setCategory: vi.fn(),

    // Order form
    venue: overrides.venue ?? "",
    setVenue: vi.fn(),
    instrument: overrides.instrument ?? "",
    setInstrument: vi.fn(),
    side: overrides.side ?? "buy",
    setSide: vi.fn(),
    quantity: overrides.quantity ?? "",
    setQuantity: vi.fn(),
    price: overrides.price ?? "",
    setPrice: vi.fn(),

    algo: overrides.algo ?? "MARKET",
    setAlgo: vi.fn(),
    algoParams: { duration: "", slices: "", displayQty: "", benchmark: "" },
    setAlgoParam: vi.fn(),

    // DeFi
    defiInstructionType: overrides.defiInstructionType ?? "SWAP",
    setDefiInstructionType: vi.fn(),
    defiAlgo: overrides.defiAlgo ?? "SOR_DEX",
    setDefiAlgo: vi.fn(),
    maxSlippageBps: overrides.maxSlippageBps ?? 50,
    setMaxSlippageBps: vi.fn(),
    availableDefiAlgos: overrides.availableDefiAlgos ?? ["SOR_DEX", "SOR_TWAP", "SOR_CROSS_CHAIN"],
    isDefiCategory: overrides.isDefiCategory ?? false,

    // Record-only fields
    counterparty: "",
    setCounterparty: vi.fn(),
    sourceReference: "",
    setSourceReference: vi.fn(),
    fee: "",
    setFee: vi.fn(),

    // OTC
    settlementMethod: "DVP",
    setSettlementMethod: vi.fn(),
    settlementCurrency: "USDT",
    setSettlementCurrency: vi.fn(),
    bilateralTerms: "",
    setBilateralTerms: vi.fn(),
    isdaReference: "",
    setIsdaReference: vi.fn(),
    isOtcCategory: overrides.isOtcCategory ?? false,

    // State
    orderState: overrides.orderState ?? "idle",
    setOrderState: vi.fn(),
    errorMessage: overrides.errorMessage ?? "",
    complianceResult: (overrides.complianceResult ?? null) as never,
    complianceUnavailable: overrides.complianceUnavailable ?? false,
    complianceLoading: overrides.complianceLoading ?? false,
    compliancePassed: overrides.compliancePassed ?? true,

    // Derived
    qty: overrides.qty ?? 0,
    priceNum: overrides.priceNum ?? 0,
    total: overrides.total ?? 0,
    canPreview: overrides.canPreview ?? false,
    canExecute: overrides.canExecute ?? true,

    // Callbacks
    handlePreview: overrides.handlePreview ?? vi.fn(),
    handleSubmit: overrides.handleSubmit ?? vi.fn(),
    resetForm: overrides.resetForm ?? vi.fn(),

    user: overrides.user ?? {
      displayName: "Test Trader",
      email: "trader@test.local",
      org: { id: "org-1" },
    },

    trades: overrides.trades ?? [],

    registryStrategies: registryStrategies as never,
    categoryLabels,
  };
}

/** Factory for a single BookTrade fixture row (widget harness only). */
export function buildMockBookTrade(overrides: Partial<BookTrade> = {}): BookTrade {
  return {
    id: "trade-1",
    timestamp: "2026-04-24T12:00:00.000Z",
    instrument: "BTC-USDT",
    venue: "Binance",
    side: "buy",
    quantity: 1.5,
    price: 64000,
    fees: 96,
    total: 96000,
    status: "filled",
    counterparty: "Binance",
    settlementDate: "2026-04-24T12:05:00.000Z",
    tradeType: "Exchange",
    ...overrides,
  };
}

/**
 * Mock for useOrganizationsList() REST hook. book-hierarchy-bar reads
 * isLoading + isError directly; the main org list also comes from useBookTradeData.
 */
export function buildMockOrganizationsList(
  overrides: { isLoading?: boolean; isError?: boolean; data?: Array<{ id: string; name: string }> } = {},
) {
  return {
    isLoading: overrides.isLoading ?? false,
    isError: overrides.isError ?? false,
    data: overrides.data ?? [
      { id: "org-1", name: "Default Org" },
      { id: "org-2", name: "Second Org" },
    ],
  };
}
