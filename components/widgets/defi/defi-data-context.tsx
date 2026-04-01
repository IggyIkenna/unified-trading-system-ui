"use client";

import { placeMockOrder } from "@/lib/api/mock-trade-ledger";
import { useExecutionMode } from "@/lib/execution-mode-context";
import { LENDING_PROTOCOLS } from "@/lib/mocks/fixtures/defi-lending";
import { LIQUIDITY_POOLS } from "@/lib/mocks/fixtures/defi-liquidity";
import {
  DEFI_RECONCILIATION_RECORDS,
  MOCK_PORTFOLIO_DELTA,
  MOCK_REBALANCE_PREVIEW,
  MOCK_TRADE_HISTORY,
  MOCK_TREASURY,
  STRATEGY_RISK_PROFILES,
  computeWeightedMockHealthFactor,
} from "@/lib/mocks/fixtures/defi-risk";
import { STAKING_PROTOCOLS } from "@/lib/mocks/fixtures/defi-staking";
import { MOCK_SWAP_ROUTE, SWAP_TOKENS } from "@/lib/mocks/fixtures/defi-swap";
import { DEFI_CHAINS, MOCK_TOKEN_BALANCES, getMockBridgeRoutes } from "@/lib/mocks/fixtures/defi-transfer";
import { CLIENTS } from "@/lib/mocks/fixtures/trading-data";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import type {
  BridgeRouteQuote,
  DeFiFlashPnl,
  DeFiOrderParams,
  DeFiReconciliationRecord,
  FlashLoanStep,
  LendingProtocol,
  LiquidityPool,
  PortfolioDeltaComposite,
  RebalancePreview,
  StakingProtocol,
  StrategyRiskProfile,
  SwapRoute,
  TradeHistoryRow,
  TreasurySnapshot,
} from "@/lib/types/defi";
import * as React from "react";

const MOCK_WALLET = "0x7a23c0ffeebee4f91deadbeef1234567890abcd";

const INITIAL_FLASH_STEPS: FlashLoanStep[] = [
  {
    id: "step-1",
    operationType: "SWAP",
    algo_type: "SOR_DEX",
    asset: "ETH",
    amount: "100",
    venue: "UNISWAPV3-ETHEREUM",
    max_slippage_bps: 50,
  },
  {
    id: "step-2",
    operationType: "SWAP",
    algo_type: "SOR_DEX",
    asset: "USDC",
    amount: "345600",
    venue: "CURVE-ETHEREUM",
    max_slippage_bps: 50,
  },
];

export interface DeFiDataContextValue {
  connectedWallet: string | null;
  selectedChain: string;
  setSelectedChain: (c: string) => void;
  tokenBalances: Record<string, number>;

  lendingProtocols: LendingProtocol[];
  selectedLendingProtocol: string;
  setSelectedLendingProtocol: (p: string) => void;
  healthFactor: number;

  swapTokens: readonly string[];
  swapRoute: SwapRoute | null;

  liquidityPools: LiquidityPool[];

  stakingProtocols: StakingProtocol[];

  flashSteps: FlashLoanStep[];
  addFlashStep: () => void;
  removeFlashStep: (id: string) => void;
  updateFlashStep: (id: string, field: string, value: string) => void;
  flashPnl: DeFiFlashPnl;

  transferMode: "send" | "bridge";
  setTransferMode: (m: "send" | "bridge") => void;

  bridgeRoutes: BridgeRouteQuote[];
  getBridgeRoutes: (token: string, amount: number, fromChain: string, toChain: string) => BridgeRouteQuote[];

  executeDeFiOrder: (params: DeFiOrderParams) => void;
  readOnly?: boolean;
  mode?: string;

  riskProfiles: StrategyRiskProfile[];
  deltaComposite: PortfolioDeltaComposite;
  treasury: TreasurySnapshot;
  tradeHistory: TradeHistoryRow[];
  reconciliationRecords: DeFiReconciliationRecord[];
  rebalancePreview: RebalancePreview | null;
  triggerRebalance: () => void;
  confirmRebalance: () => void;
  cancelRebalance: () => void;
}

const DeFiDataContext = React.createContext<DeFiDataContextValue | null>(null);

export function DeFiDataProvider({ children }: { children: React.ReactNode }) {
  const { isPaper, isBatch, mode } = useExecutionMode();
  const { scope: globalScope } = useGlobalScope();

  // Check if selected org has a DeFi desk
  const hasDefiDesk = React.useMemo(() => {
    if (globalScope.organizationIds.length === 0) return true; // no filter = show all
    return CLIENTS.some((c) => globalScope.organizationIds.includes(c.orgId) && c.id === "defi-desk");
  }, [globalScope.organizationIds]);
  const [selectedChain, setSelectedChain] = React.useState<string>(DEFI_CHAINS[0]);
  const [selectedLendingProtocol, setSelectedLendingProtocol] = React.useState(LENDING_PROTOCOLS[0]?.name ?? "Aave V3");
  const [flashSteps, setFlashSteps] = React.useState<FlashLoanStep[]>(INITIAL_FLASH_STEPS);
  const [transferMode, setTransferMode] = React.useState<"send" | "bridge">("send");
  const [tradeHistory, setTradeHistory] = React.useState<TradeHistoryRow[]>(MOCK_TRADE_HISTORY);

  const healthFactor = React.useMemo(() => computeWeightedMockHealthFactor(MOCK_TREASURY.per_strategy_balance), []);

  const swapRoute = MOCK_SWAP_ROUTE;

  const flashPnl: DeFiFlashPnl = React.useMemo(() => {
    const grossProfit = 185.6;
    const flashFee = 27.5;
    const gasEstimate = 42.3;
    return {
      grossProfit,
      flashFee,
      gasEstimate,
      netPnl: grossProfit - flashFee - gasEstimate,
    };
  }, []);

  const [treasury, setTreasury] = React.useState<TreasurySnapshot>(MOCK_TREASURY);
  const [rebalancePreview, setRebalancePreview] = React.useState<RebalancePreview | null>(null);

  const triggerRebalance = React.useCallback(() => {
    setRebalancePreview(MOCK_REBALANCE_PREVIEW);
  }, []);

  const confirmRebalance = React.useCallback(() => {
    setRebalancePreview(null);
    setTreasury((prev) => ({
      ...prev,
      status: "normal",
      treasury_pct: 20,
      treasury_balance_usd: prev.total_aum_usd * 0.2,
      total_trading_balance_usd: prev.total_aum_usd * 0.8,
    }));
  }, []);

  const cancelRebalance = React.useCallback(() => {
    setRebalancePreview(null);
  }, []);

  const addFlashStep = React.useCallback(() => {
    setFlashSteps((steps) => [
      ...steps,
      {
        id: `step-${Date.now()}`,
        operationType: "SWAP",
        algo_type: "SOR_DEX",
        asset: "ETH",
        amount: "",
        venue: "UNISWAPV3-ETHEREUM",
        max_slippage_bps: 50,
      },
    ]);
  }, []);

  const removeFlashStep = React.useCallback((id: string) => {
    setFlashSteps((steps) => steps.filter((s) => s.id !== id));
  }, []);

  const updateFlashStep = React.useCallback((id: string, field: string, value: string) => {
    setFlashSteps((steps) => steps.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }, []);

  const getBridgeRoutes = React.useCallback(
    (token: string, amount: number, fromChain: string, toChain: string): BridgeRouteQuote[] => {
      if (!hasDefiDesk) return [];
      return getMockBridgeRoutes(token, amount, fromChain, toChain);
    },
    [hasDefiDesk],
  );

  const bridgeRoutes = React.useMemo<BridgeRouteQuote[]>(() => [], []);

  const executeDeFiOrder = React.useCallback(
    (params: DeFiOrderParams) => {
      placeMockOrder(params);

      // Add new trade to history
      const newTrade: TradeHistoryRow = {
        seq: (tradeHistory.length || 0) + 1,
        timestamp: new Date().toISOString(),
        instruction_type: params.instruction_type,
        algo_type: params.algo_type,
        instrument_id: params.instrument_id,
        venue: params.venue,
        amount: params.quantity,
        price: params.price,
        expected_output: params.expected_output,
        actual_output: params.expected_output * (1 - params.max_slippage_bps / 10000),
        instant_pnl: {
          gross_pnl: 0,
          price_slippage_usd: 0,
          gas_cost_usd: 5, // Mock gas cost
          trading_fee_usd: 0,
          bridge_fee_usd: 0,
          net_pnl: -5,
          slippage_exceeded: false,
        },
        running_pnl: (tradeHistory[tradeHistory.length - 1]?.running_pnl ?? 0) - 5,
        status: "filled",
      };

      setTradeHistory((prev) => [...prev, newTrade]);
    },
    [tradeHistory],
  );

  // Paper mode: 10x testnet balances; Batch mode: read-only flag
  // When an org without a DeFi desk is selected, show zero balances
  const adjustedTokenBalances = React.useMemo(() => {
    if (!hasDefiDesk) {
      const zeroed: Record<string, number> = {};
      for (const key of Object.keys(MOCK_TOKEN_BALANCES)) {
        zeroed[key] = 0;
      }
      return zeroed;
    }
    if (!isPaper) return MOCK_TOKEN_BALANCES;
    const scaled: Record<string, number> = {};
    for (const [key, val] of Object.entries(MOCK_TOKEN_BALANCES)) {
      scaled[key] = val * 10;
    }
    return scaled;
  }, [isPaper, hasDefiDesk]);

  // Batch mode: mark protocols as historical; org scope: empty if no DeFi desk
  const adjustedLendingProtocols = React.useMemo(() => {
    if (!hasDefiDesk) return [];
    if (!isBatch) return LENDING_PROTOCOLS;
    return LENDING_PROTOCOLS.map((p) => ({ ...p, name: `${p.name} (Historical)` }));
  }, [isBatch, hasDefiDesk]);

  const value = React.useMemo<DeFiDataContextValue>(
    () => ({
      connectedWallet: MOCK_WALLET,
      selectedChain,
      setSelectedChain,
      tokenBalances: adjustedTokenBalances,
      lendingProtocols: adjustedLendingProtocols,
      selectedLendingProtocol,
      setSelectedLendingProtocol,
      healthFactor,
      swapTokens: SWAP_TOKENS,
      swapRoute,
      liquidityPools: LIQUIDITY_POOLS,
      stakingProtocols: STAKING_PROTOCOLS,
      flashSteps,
      addFlashStep,
      removeFlashStep,
      updateFlashStep,
      flashPnl,
      transferMode,
      setTransferMode,
      bridgeRoutes,
      getBridgeRoutes,
      executeDeFiOrder,
      readOnly: isBatch,
      mode,
      riskProfiles: STRATEGY_RISK_PROFILES,
      deltaComposite: MOCK_PORTFOLIO_DELTA,
      treasury,
      tradeHistory,
      reconciliationRecords: DEFI_RECONCILIATION_RECORDS,
      rebalancePreview,
      triggerRebalance,
      confirmRebalance,
      cancelRebalance,
    }),
    [
      selectedChain,
      selectedLendingProtocol,
      adjustedTokenBalances,
      adjustedLendingProtocols,
      healthFactor,
      flashSteps,
      flashPnl,
      transferMode,
      bridgeRoutes,
      getBridgeRoutes,
      addFlashStep,
      removeFlashStep,
      updateFlashStep,
      executeDeFiOrder,
      swapRoute,
      isBatch,
      mode,
      treasury,
      tradeHistory,
      rebalancePreview,
      triggerRebalance,
      confirmRebalance,
      cancelRebalance,
    ],
  );

  return <DeFiDataContext.Provider value={value}>{children}</DeFiDataContext.Provider>;
}

export function useDeFiData(): DeFiDataContextValue {
  const ctx = React.useContext(DeFiDataContext);
  if (!ctx) throw new Error("useDeFiData must be used within DeFiDataProvider");
  return ctx;
}
