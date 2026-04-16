"use client";

import type { MockOrder } from "@/lib/api/mock-trade-ledger";
import { getFilledDefiOrders, placeMockOrder } from "@/lib/api/mock-trade-ledger";
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
import {
  MOCK_EMERGENCY_EXIT,
  MOCK_FUNDING_RATES,
  MOCK_HEALTH_FACTOR,
  MOCK_REWARD_PNL,
  MOCK_STAKING_REWARDS,
  MOCK_WATERFALL_WEIGHTS_PATRICK,
} from "@/lib/mocks/fixtures/defi-walkthrough";
import { CLIENTS } from "@/lib/mocks/fixtures/trading-data";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import type {
  BridgeRouteQuote,
  DeFiFlashPnl,
  DeFiOrderParams,
  DeFiReconciliationRecord,
  EmergencyExitEstimate,
  FlashLoanStep,
  FundingRateMatrix,
  HealthFactorDashboard,
  LendingProtocol,
  LiquidityPool,
  PortfolioDeltaComposite,
  RebalancePreview,
  RewardPnLBreakdown,
  StakingProtocol,
  StakingReward,
  StrategyRiskProfile,
  SwapRoute,
  TradeHistoryRow,
  TreasurySnapshot,
  WaterfallWeights,
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

  // Walkthrough enhancements
  stakingRewards: StakingReward[];
  claimReward: (token: string) => void;
  claimAndSellReward: (token: string) => void;
  fundingRates: FundingRateMatrix;
  waterfallWeights: WaterfallWeights;
  healthFactorDashboard: HealthFactorDashboard;
  emergencyExit: EmergencyExitEstimate;
  rewardPnl: RewardPnLBreakdown;
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
  const [ledgerVersion, setLedgerVersion] = React.useState(0);

  // Derive trade history from mock ledger (persistent) + seed data
  // Respects globalScope.strategyIds when set
  const scopeStrategyIds = globalScope.strategyIds;

  const tradeHistory = React.useMemo((): TradeHistoryRow[] => {
    const seedRows = [...MOCK_TRADE_HISTORY];
    let ledgerOrders = getFilledDefiOrders();

    // If strategy filter is active, only include ledger orders matching selected strategies
    if (scopeStrategyIds.length > 0) {
      ledgerOrders = ledgerOrders.filter(
        (o: MockOrder) => o.strategy_id && scopeStrategyIds.includes(o.strategy_id),
      );
    }

    // Convert ledger orders to TradeHistoryRow format
    const ledgerRows: TradeHistoryRow[] = ledgerOrders
      .filter((o: MockOrder) => !seedRows.some((s) => s.timestamp === o.timestamp && s.venue === o.venue))
      .map((o: MockOrder, idx: number): TradeHistoryRow => {
        const instrUpper = o.instrument_id.toUpperCase();
        const gas = instrUpper.includes("FLASH") || instrUpper.includes("MORPHO")
          ? 25
          : instrUpper.includes("SWAP") || instrUpper.includes("UNISWAP") || instrUpper.includes("CURVE")
            ? 15
            : 5;
        // Slippage = difference between expected price and actual fill price × quantity
        const expectedPrice = o.price;
        const fillPrice = o.average_fill_price ?? o.price;
        const slippage = Math.abs(fillPrice - expectedPrice) * o.quantity;
        return {
          seq: seedRows.length + idx + 1,
          timestamp: o.timestamp,
          instruction_type: instrUpper.includes("FLASH") ? "FLASH_BORROW"
            : instrUpper.includes("SWAP") || instrUpper.includes("UNISWAP") ? "SWAP"
              : instrUpper.includes("A_TOKEN") || instrUpper.includes("LEND") ? "LEND"
                : instrUpper.includes("DEBT_TOKEN") || instrUpper.includes("BORROW") ? "BORROW"
                  : instrUpper.includes("LST") || instrUpper.includes("STAKE") ? "STAKE"
                    : instrUpper.includes("PERP") || instrUpper.includes("PERPETUAL") ? "TRADE"
                      : "TRANSFER",
          algo_type: (o.algo_type ?? "DIRECT") as TradeHistoryRow["algo_type"],
          instrument_id: o.instrument_id,
          venue: o.venue,
          amount: o.quantity,
          price: fillPrice,
          expected_output: o.quantity * expectedPrice,
          actual_output: o.quantity * fillPrice,
          instant_pnl: {
            gross_pnl: 0,
            price_slippage_usd: slippage,
            gas_cost_usd: gas,
            trading_fee_usd: 0,
            bridge_fee_usd: 0,
            net_pnl: -(gas + slippage),
            slippage_exceeded: false,
          },
          running_pnl: 0, // computed below
          status: "filled",
          // Alpha P&L: execution fill price vs strategy reference/benchmark price
          // Reference = mid-market at signal time (what strategy-service saw)
          reference_price: expectedPrice,
          alpha_pnl_usd: slippage > 0
            ? -slippage
            : 0,
          strategy_id: o.strategy_id,
          execution_chain: [
            { label: "Signal", detail: "Strategy generated instruction", duration_ms: 2 },
            { label: "Risk Check", detail: "Pre-trade exposure validation", duration_ms: 5 },
            { label: "Algo Select", detail: `Selected ${o.algo_type ?? "DIRECT"}`, duration_ms: 1 },
            { label: "Route", detail: `Best route → ${o.venue}`, duration_ms: 12 },
            { label: "Execute", detail: `Fill @ ${fillPrice.toFixed(2)}`, duration_ms: 180 },
          ],
        };
      });

    const allRows = [...seedRows, ...ledgerRows];
    let running = 0;
    for (let i = 0; i < allRows.length; i++) {
      const row = allRows[i];
      running += row.instant_pnl.net_pnl;
      row.running_pnl = running;
      row.seq = i + 1;

      if (!row.strategy_id) {
        if (row.instruction_type === "FLASH_BORROW" || row.instruction_type === "FLASH_REPAY") {
          row.strategy_id = "RECURSIVE_STAKED_BASIS";
        } else if (row.instruction_type === "LEND" || row.instruction_type === "BORROW") {
          row.strategy_id = "AAVE_LENDING";
        } else if (row.instruction_type === "TRADE") {
          row.strategy_id = "BASIS_TRADE";
        } else if (row.instruction_type === "STAKE") {
          row.strategy_id = "STAKED_BASIS";
        } else if (row.instruction_type === "ADD_LIQUIDITY" || row.instruction_type === "REMOVE_LIQUIDITY") {
          row.strategy_id = "AMM_LP";
        }
      }

      if (!row.execution_chain && !row.is_child_fill) {
        row.execution_chain = [
          { label: "Signal", detail: `${row.strategy_id ?? "manual"}`, duration_ms: 2 },
          { label: "Risk Check", detail: "Pre-trade validation", duration_ms: 4 },
          { label: "Algo Select", detail: row.algo_type, duration_ms: 1 },
          { label: "Route", detail: row.venue, duration_ms: 10 },
          { label: "Fill", detail: row.status, duration_ms: 150 },
        ];
      }
    }
    return allRows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ledgerVersion, scopeStrategyIds]);

  // Listen for ledger changes (new orders filled, reset)
  React.useEffect(() => {
    const refresh = () => setLedgerVersion((v) => v + 1);
    window.addEventListener("mock-order-filled", refresh);
    window.addEventListener("mock-ledger-reset", refresh);
    return () => {
      window.removeEventListener("mock-order-filled", refresh);
      window.removeEventListener("mock-ledger-reset", refresh);
    };
  }, []);

  const healthFactor = React.useMemo(() => computeWeightedMockHealthFactor(MOCK_TREASURY.per_strategy_balance), []);

  const swapRoute = MOCK_SWAP_ROUTE;

  // Flash P&L computed from actual configured steps
  const flashPnl: DeFiFlashPnl = React.useMemo(() => {
    // Estimate based on step count and types
    const stepCount = flashSteps.length;
    // Each step has gas cost: ~$15 per swap, ~$8 per lend/borrow, ~$5 per transfer
    const gasEstimate = flashSteps.reduce((sum, step) => {
      const op = step.operationType?.toUpperCase() ?? "";
      if (op.includes("SWAP")) return sum + 15;
      if (op.includes("LEND") || op.includes("BORROW")) return sum + 8;
      return sum + 5;
    }, 0);
    // Flash loan fee: Morpho = 0 bps, Aave = 5 bps (0.05%)
    const totalAmount = flashSteps.reduce((s, step) => s + (parseFloat(step.amount) || 0), 0);
    const flashFee = totalAmount * 3400 * 0.0005; // Aave fee estimate (conservative)
    // Gross profit estimate: recursive staking yield differential
    // weETH/ETH spread × leverage — realistic ~0.5% per recursive loop
    const grossProfit = totalAmount * 3400 * 0.005;
    return {
      grossProfit: Math.round(grossProfit * 100) / 100,
      flashFee: Math.round(flashFee * 100) / 100,
      gasEstimate: Math.round(gasEstimate * 100) / 100,
      netPnl: Math.round((grossProfit - flashFee - gasEstimate) * 100) / 100,
    };
  }, [flashSteps]);

  const [treasury, setTreasury] = React.useState<TreasurySnapshot>(MOCK_TREASURY);
  const [stakingRewards, setStakingRewards] = React.useState<StakingReward[]>(MOCK_STAKING_REWARDS);
  const [rewardPnl, setRewardPnl] = React.useState<RewardPnLBreakdown>(MOCK_REWARD_PNL);

  // Simulate real-time reward accrual — every 10s, accrue a small amount to tokens
  // with weekly frequency, reflecting continuous yield generation
  React.useEffect(() => {
    const timer = setInterval(() => {
      setStakingRewards((prev) =>
        prev.map((r) => {
          if (r.frequency !== "WEEKLY" || r.accrued_amount <= 0) return r;
          const tickAmount = r.accrued_amount * 0.001;
          const pricePerToken = r.accrued_value_usd / r.accrued_amount;
          return {
            ...r,
            accrued_amount: Math.round((r.accrued_amount + tickAmount) * 10000) / 10000,
            accrued_value_usd: Math.round((r.accrued_value_usd + tickAmount * pricePerToken) * 100) / 100,
          };
        }),
      );
    }, 10_000);
    return () => clearInterval(timer);
  }, []);

  const claimReward = React.useCallback((token: string) => {
    setStakingRewards((prev) =>
      prev.map((r) =>
        r.token === token
          ? { ...r, claimed_amount: r.claimed_amount + r.accrued_amount, accrued_amount: 0, accrued_value_usd: 0 }
          : r,
      ),
    );
  }, []);

  const claimAndSellReward = React.useCallback((token: string) => {
    setStakingRewards((prev) =>
      prev.map((r) => {
        if (r.token !== token) return r;
        const totalSold = r.sold_amount + r.accrued_amount;
        const totalSoldValue = r.sold_value_usd + r.accrued_value_usd;
        return {
          ...r,
          sold_amount: totalSold,
          sold_value_usd: totalSoldValue,
          claimed_amount: r.claimed_amount + r.accrued_amount,
          accrued_amount: 0,
          accrued_value_usd: 0,
        };
      }),
    );
    // Update reward P&L
    setRewardPnl((prev) => {
      const reward = stakingRewards.find((r) => r.token === token);
      if (!reward) return prev;
      return {
        ...prev,
        restaking_reward: {
          ...prev.restaking_reward,
          amount: prev.restaking_reward.amount + reward.accrued_value_usd,
        },
        reward_unrealised: {
          ...prev.reward_unrealised,
          amount: Math.max(0, prev.reward_unrealised.amount - reward.accrued_value_usd),
        },
      };
    });
  }, [stakingRewards]);
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
      // Write to persistent mock ledger — the trade history is derived from it
      placeMockOrder(params);
      // The mock-order-filled event (fired after 200ms fill) triggers ledgerVersion++
      // which recomputes tradeHistory from the ledger automatically
    },
    [],
  );

  // Paper mode: 10x testnet balances; Batch mode: read-only flag
  // When an org without a DeFi desk is selected, show zero balances
  // Reactive: subtract filled DeFi orders from base balances
  const adjustedTokenBalances = React.useMemo(() => {
    if (!hasDefiDesk) {
      const zeroed: Record<string, number> = {};
      for (const key of Object.keys(MOCK_TOKEN_BALANCES)) {
        zeroed[key] = 0;
      }
      return zeroed;
    }
    const base: Record<string, number> = {};
    const multiplier = isPaper ? 10 : 1;
    for (const [key, val] of Object.entries(MOCK_TOKEN_BALANCES)) {
      base[key] = val * multiplier;
    }
    // Adjust balances based on filled ledger orders
    const filled = getFilledDefiOrders();
    for (const order of filled) {
      const asset = order.instrument_id.split(":").pop()?.split("@")[0]?.toUpperCase() ?? "";
      const qty = order.filled_quantity ?? order.quantity;
      if (order.side === "buy") {
        base[asset] = (base[asset] ?? 0) + qty;
      } else {
        base[asset] = (base[asset] ?? 0) - qty;
      }
    }
    // Clamp all balances to zero — no negatives from large demo trades
    for (const key of Object.keys(base)) {
      if (base[key] < 0) base[key] = 0;
    }
    return base;
  }, [isPaper, hasDefiDesk, ledgerVersion]);

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
      stakingRewards,
      claimReward,
      claimAndSellReward,
      fundingRates: MOCK_FUNDING_RATES,
      waterfallWeights: MOCK_WATERFALL_WEIGHTS_PATRICK,
      healthFactorDashboard: MOCK_HEALTH_FACTOR,
      emergencyExit: MOCK_EMERGENCY_EXIT,
      rewardPnl,
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
      stakingRewards,
      claimReward,
      claimAndSellReward,
      rewardPnl,
    ],
  );

  return <DeFiDataContext.Provider value={value}>{children}</DeFiDataContext.Provider>;
}

export function useDeFiData(): DeFiDataContextValue {
  const ctx = React.useContext(DeFiDataContext);
  if (!ctx) throw new Error("useDeFiData must be used within DeFiDataProvider");
  return ctx;
}
