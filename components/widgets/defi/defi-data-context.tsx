"use client";

import * as React from "react";
import { useExecutionMode } from "@/lib/execution-mode-context";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import { CLIENTS } from "@/lib/trading-data";
import { placeMockOrder } from "@/lib/api/mock-trade-ledger";
import { LENDING_PROTOCOLS } from "@/lib/mocks/fixtures/defi-lending";
import { MOCK_SWAP_ROUTE, SWAP_TOKENS } from "@/lib/mocks/fixtures/defi-swap";
import { LIQUIDITY_POOLS } from "@/lib/mocks/fixtures/defi-liquidity";
import { STAKING_PROTOCOLS } from "@/lib/mocks/fixtures/defi-staking";
import { DEFI_CHAINS, MOCK_TOKEN_BALANCES } from "@/lib/mocks/fixtures/defi-transfer";
import type {
  DeFiFlashPnl,
  DeFiOrderParams,
  FlashLoanStep,
  LendingProtocol,
  LiquidityPool,
  StakingProtocol,
  SwapRoute,
} from "@/lib/types/defi";

const MOCK_WALLET = "0x7a23c0ffeebee4f91deadbeef1234567890abcd";

const INITIAL_FLASH_STEPS: FlashLoanStep[] = [
  {
    id: "step-1",
    operationType: "SWAP",
    asset: "ETH",
    amount: "100",
    venue: "Uniswap",
  },
  {
    id: "step-2",
    operationType: "SWAP",
    asset: "USDC",
    amount: "345600",
    venue: "Curve",
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

  executeDeFiOrder: (params: DeFiOrderParams) => void;
  readOnly?: boolean;
  mode?: string;
}

const DeFiDataContext = React.createContext<DeFiDataContextValue | null>(null);

export function DeFiDataProvider({ children }: { children: React.ReactNode }) {
  const { isPaper, isBatch, mode } = useExecutionMode();
  const { scope: globalScope } = useGlobalScope();

  // Check if selected org has a DeFi desk
  const hasDefiDesk = React.useMemo(() => {
    if (globalScope.organizationIds.length === 0) return true; // no filter = show all
    return CLIENTS.some(
      (c) => globalScope.organizationIds.includes(c.orgId) && c.id === "defi-desk",
    );
  }, [globalScope.organizationIds]);
  const [selectedChain, setSelectedChain] = React.useState<string>(DEFI_CHAINS[0]);
  const [selectedLendingProtocol, setSelectedLendingProtocol] = React.useState(LENDING_PROTOCOLS[0]?.name ?? "Aave V3");
  const [flashSteps, setFlashSteps] = React.useState<FlashLoanStep[]>(INITIAL_FLASH_STEPS);
  const [transferMode, setTransferMode] = React.useState<"send" | "bridge">("send");

  const healthFactor = 1.85;

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

  const addFlashStep = React.useCallback(() => {
    setFlashSteps((steps) => [
      ...steps,
      {
        id: `step-${Date.now()}`,
        operationType: "SWAP",
        asset: "ETH",
        amount: "",
        venue: "Uniswap",
      },
    ]);
  }, []);

  const removeFlashStep = React.useCallback((id: string) => {
    setFlashSteps((steps) => steps.filter((s) => s.id !== id));
  }, []);

  const updateFlashStep = React.useCallback((id: string, field: string, value: string) => {
    setFlashSteps((steps) => steps.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }, []);

  const executeDeFiOrder = React.useCallback((params: DeFiOrderParams) => {
    placeMockOrder(params);
  }, []);

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
      executeDeFiOrder,
      readOnly: isBatch,
      mode,
    }),
    [
      selectedChain,
      selectedLendingProtocol,
      adjustedTokenBalances,
      adjustedLendingProtocols,
      flashSteps,
      flashPnl,
      transferMode,
      addFlashStep,
      removeFlashStep,
      updateFlashStep,
      executeDeFiOrder,
      swapRoute,
      isBatch,
      isPaper,
      mode,
    ],
  );

  return <DeFiDataContext.Provider value={value}>{children}</DeFiDataContext.Provider>;
}

export function useDeFiData(): DeFiDataContextValue {
  const ctx = React.useContext(DeFiDataContext);
  if (!ctx) throw new Error("useDeFiData must be used within DeFiDataProvider");
  return ctx;
}
