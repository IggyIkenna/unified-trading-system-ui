import {
  ArrowLeftRight,
  BarChart3,
  Coins,
  DollarSign,
  Droplets,
  Gift,
  Heart,
  History,
  Landmark,
  Layers,
  Send,
  Settings,
  Wallet,
  TrendingUp,
  Zap,
} from "lucide-react";
import { registerPresets } from "../preset-registry";
import { registerWidget } from "../widget-registry";
import { DeFiFlashLoansWidget } from "./defi-flash-loans-widget";
import { DeFiFundingMatrixWidget } from "./defi-funding-matrix-widget";
import { DeFiHealthFactorWidget } from "./defi-health-factor-widget";
import { DeFiLendingWidget } from "./defi-lending-widget";
import { DeFiLiquidityWidget } from "./defi-liquidity-widget";
import { DeFiRatesOverviewWidget } from "./defi-rates-overview-widget";
import { DeFiRewardPnlWidget } from "./defi-reward-pnl-widget";
import { DeFiStakingRewardsWidget } from "./defi-staking-rewards-widget";
import { DeFiStakingWidget } from "./defi-staking-widget";
import { DeFiStrategyConfigWidget } from "./defi-strategy-config-widget";
import { DeFiSwapWidget } from "./defi-swap-widget";
import { DeFiTradeHistoryWidget } from "./defi-trade-history-widget";
import { DeFiTransferWidget } from "./defi-transfer-widget";
import { DeFiWalletSummaryWidget } from "./defi-wallet-summary-widget";
import { DeFiWaterfallWeightsWidget } from "./defi-waterfall-weights-widget";
import { DeFiYieldChartWidget } from "./defi-yield-chart-widget";
import { EnhancedBasisWidget } from "./enhanced-basis-widget";

registerPresets("defi", [
  {
    id: "defi-default",
    name: "Default",
    tab: "defi",
    isPreset: true,
    layouts: [
      { widgetId: "defi-wallet-summary", instanceId: "defi-wallet-summary-1", x: 0, y: 0, w: 24, h: 2 },
      { widgetId: "defi-lending", instanceId: "defi-lending-1", x: 0, y: 2, w: 8, h: 6 },
      { widgetId: "defi-swap", instanceId: "defi-swap-1", x: 8, y: 2, w: 8, h: 6 },
      { widgetId: "defi-staking", instanceId: "defi-staking-1", x: 16, y: 2, w: 8, h: 6 },
      { widgetId: "defi-transfer", instanceId: "defi-transfer-1", x: 0, y: 8, w: 8, h: 6 },
      { widgetId: "defi-trade-history", instanceId: "defi-trade-history-1", x: 8, y: 8, w: 16, h: 6 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "defi-advanced",
    name: "Advanced",
    tab: "defi",
    isPreset: true,
    layouts: [
      { widgetId: "defi-wallet-summary", instanceId: "defi-wallet-summary-adv", x: 0, y: 0, w: 24, h: 2 },
      { widgetId: "defi-lending", instanceId: "defi-lending-adv", x: 0, y: 2, w: 8, h: 6 },
      { widgetId: "defi-swap", instanceId: "defi-swap-adv", x: 8, y: 2, w: 8, h: 6 },
      { widgetId: "defi-staking", instanceId: "defi-staking-adv", x: 16, y: 2, w: 8, h: 6 },
      { widgetId: "defi-liquidity", instanceId: "defi-liquidity-1", x: 0, y: 8, w: 24, h: 7 },
      { widgetId: "defi-transfer", instanceId: "defi-transfer-adv", x: 0, y: 15, w: 12, h: 6 },
      { widgetId: "defi-strategy-config", instanceId: "defi-strategy-config-adv", x: 12, y: 15, w: 12, h: 6 },
      { widgetId: "defi-trade-history", instanceId: "defi-trade-history-adv", x: 0, y: 21, w: 24, h: 5 },
      { widgetId: "enhanced-basis-dashboard", instanceId: "enhanced-basis-adv", x: 0, y: 26, w: 12, h: 6 },
      { widgetId: "active-lp-dashboard", instanceId: "active-lp-adv", x: 12, y: 26, w: 12, h: 6 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "defi-walkthrough",
    name: "Walkthrough (Patrick)",
    tab: "defi",
    isPreset: true,
    layouts: [
      // Wallet header
      { widgetId: "defi-wallet-summary", instanceId: "defi-wallet-wt", x: 0, y: 0, w: 24, h: 2 },
      // Staking group: staking + staking-rewards + health-factor (same height)
      { widgetId: "defi-staking", instanceId: "defi-staking-wt", x: 0, y: 2, w: 8, h: 6 },
      { widgetId: "defi-staking-rewards", instanceId: "defi-staking-rewards-wt", x: 8, y: 2, w: 8, h: 6 },
      { widgetId: "defi-health-factor", instanceId: "defi-health-factor-wt", x: 16, y: 2, w: 8, h: 6 },
      // Config row (same height)
      { widgetId: "defi-funding-matrix", instanceId: "defi-funding-matrix-wt", x: 0, y: 8, w: 16, h: 5 },
      { widgetId: "defi-strategy-config", instanceId: "defi-strategy-config-wt", x: 16, y: 8, w: 8, h: 5 },
      // Attribution row (same height)
      { widgetId: "defi-waterfall-weights", instanceId: "defi-waterfall-weights-wt", x: 0, y: 13, w: 12, h: 6 },
      { widgetId: "defi-reward-pnl", instanceId: "defi-reward-pnl-wt", x: 12, y: 13, w: 12, h: 6 },
      // Full-width chart + trade history
      { widgetId: "defi-yield-chart", instanceId: "defi-yield-chart-wt", x: 0, y: 19, w: 24, h: 7 },
      { widgetId: "defi-trade-history", instanceId: "defi-trade-history-wt", x: 0, y: 26, w: 24, h: 5 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "defi-full",
    name: "Full",
    tab: "defi",
    isPreset: true,
    layouts: [
      // Capital ops header: wallet full width
      { widgetId: "defi-wallet-summary", instanceId: "defi-wallet-summary-full", x: 0, y: 0, w: 24, h: 2 },
      // Core actions: lending + swap + staking (3 equal forms)
      { widgetId: "defi-lending", instanceId: "defi-lending-full", x: 0, y: 2, w: 8, h: 6 },
      { widgetId: "defi-swap", instanceId: "defi-swap-full", x: 8, y: 2, w: 8, h: 6 },
      { widgetId: "defi-staking", instanceId: "defi-staking-full", x: 16, y: 2, w: 8, h: 6 },
      // Transfer + strategy config (same height)
      { widgetId: "defi-transfer", instanceId: "defi-transfer-full", x: 0, y: 8, w: 12, h: 6 },
      { widgetId: "defi-strategy-config", instanceId: "defi-strategy-config-full", x: 12, y: 8, w: 12, h: 6 },
      // Yield & rates (full-width chart + table)
      { widgetId: "defi-rates-overview", instanceId: "defi-rates-overview-full", x: 0, y: 14, w: 24, h: 4 },
      { widgetId: "defi-yield-chart", instanceId: "defi-yield-chart-full", x: 0, y: 18, w: 24, h: 6 },
      // Monitoring row 1: health + funding matrix (same height)
      { widgetId: "defi-health-factor", instanceId: "defi-health-factor-full", x: 0, y: 24, w: 8, h: 6 },
      { widgetId: "defi-funding-matrix", instanceId: "defi-funding-matrix-full", x: 8, y: 24, w: 16, h: 6 },
      // Monitoring row 2: waterfall + reward-pnl + staking-rewards (3 equal)
      { widgetId: "defi-waterfall-weights", instanceId: "defi-waterfall-weights-full", x: 0, y: 30, w: 8, h: 6 },
      { widgetId: "defi-reward-pnl", instanceId: "defi-reward-pnl-full", x: 8, y: 30, w: 8, h: 6 },
      { widgetId: "defi-staking-rewards", instanceId: "defi-staking-rewards-full", x: 16, y: 30, w: 8, h: 6 },
      // Advanced row 1: flash loans + liquidity (same height)
      { widgetId: "defi-flash-loans", instanceId: "defi-flash-loans-full", x: 0, y: 36, w: 12, h: 7 },
      { widgetId: "defi-liquidity", instanceId: "defi-liquidity-full", x: 12, y: 36, w: 12, h: 7 },
      // Advanced row 2: basis + active-lp (same height)
      { widgetId: "enhanced-basis-dashboard", instanceId: "enhanced-basis-full", x: 0, y: 43, w: 12, h: 6 },
      { widgetId: "active-lp-dashboard", instanceId: "active-lp-full", x: 12, y: 43, w: 12, h: 6 },
      // Trade history at the very bottom
      { widgetId: "defi-trade-history", instanceId: "defi-trade-history-full", x: 0, y: 49, w: 24, h: 5 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]);

registerWidget({
  id: "defi-wallet-summary",
  label: "Wallet Summary",
  description: "Token balances, connected wallet, chain selector.",
  icon: Wallet,
  minW: 6,
  minH: 2,
  defaultW: 8,
  defaultH: 2,
  requiredEntitlements: [{ domain: "trading-defi", tier: "basic" }],
  category: "DeFi",
  availableOn: ["defi"],
  singleton: true,
  component: DeFiWalletSummaryWidget,
});

registerWidget({
  id: "defi-lending",
  label: "DeFi Lending",
  description: "Protocol selector, lend/borrow/withdraw/repay, APY, health factor preview.",
  icon: Landmark,
  minW: 6,
  minH: 4,
  defaultW: 8,
  defaultH: 6,
  requiredEntitlements: [{ domain: "trading-defi", tier: "basic" }],
  category: "DeFi",
  availableOn: ["defi"],
  singleton: true,
  component: DeFiLendingWidget,
});

registerWidget({
  id: "defi-swap",
  label: "DeFi Swap",
  description: "Token pair, amount, slippage, route with price impact and gas. Supports basis trade mode.",
  icon: ArrowLeftRight,
  minW: 6,
  minH: 4,
  defaultW: 8,
  defaultH: 6,
  requiredEntitlements: [{ domain: "trading-defi", tier: "basic" }],
  category: "DeFi",
  availableOn: ["defi"],
  singleton: true,
  component: DeFiSwapWidget,
});

registerWidget({
  id: "defi-liquidity",
  label: "Liquidity Provision",
  description: "Add/remove liquidity, pool selector, fee tier, price range, TVL/APR.",
  icon: Droplets,
  minW: 6,
  minH: 5,
  defaultW: 8,
  defaultH: 7,
  requiredEntitlements: [{ domain: "trading-defi", tier: "basic" }],
  category: "DeFi",
  availableOn: ["defi"],
  singleton: true,
  component: DeFiLiquidityWidget,
});

registerWidget({
  id: "defi-staking",
  label: "Staking",
  description: "Stake/unstake, protocol APY, yield, TVL, unbonding.",
  icon: Coins,
  minW: 6,
  minH: 4,
  defaultW: 8,
  defaultH: 6,
  requiredEntitlements: [{ domain: "trading-defi", tier: "basic" }],
  category: "DeFi",
  availableOn: ["defi"],
  singleton: true,
  component: DeFiStakingWidget,
});

registerWidget({
  id: "defi-flash-loans",
  label: "Flash Loan Builder",
  description: "Multi-step flash bundle, borrow/repay legs, P&L preview.",
  icon: Zap,
  minW: 8,
  minH: 5,
  defaultW: 12,
  defaultH: 7,
  requiredEntitlements: [{ domain: "trading-defi", tier: "basic" }],
  category: "DeFi",
  availableOn: ["defi"],
  singleton: true,
  component: DeFiFlashLoansWidget,
});

registerWidget({
  id: "defi-transfer",
  label: "Transfer & Bridge",
  description: "Send on one chain or bridge cross-chain with gas estimate.",
  icon: Send,
  minW: 6,
  minH: 4,
  defaultW: 8,
  defaultH: 6,
  requiredEntitlements: [{ domain: "trading-defi", tier: "basic" }],
  category: "DeFi",
  availableOn: ["defi"],
  singleton: true,
  component: DeFiTransferWidget,
});

registerWidget({
  id: "defi-rates-overview",
  label: "Rates Overview",
  description: "Protocol APY comparison across lending, staking, and LP yields.",
  icon: BarChart3,
  minW: 8,
  minH: 3,
  defaultW: 16,
  defaultH: 4,
  requiredEntitlements: [{ domain: "trading-defi", tier: "basic" }],
  category: "DeFi",
  availableOn: ["defi"],
  singleton: true,
  component: DeFiRatesOverviewWidget,
});

registerWidget({
  id: "defi-trade-history",
  label: "Trade History",
  description: "Executed instructions with instant P&L decomposition and running totals.",
  icon: History,
  minW: 12,
  minH: 3,
  defaultW: 24,
  defaultH: 5,
  requiredEntitlements: [{ domain: "trading-defi", tier: "basic" }],
  category: "DeFi",
  availableOn: ["defi"],
  singleton: true,
  component: DeFiTradeHistoryWidget,
});

registerWidget({
  id: "defi-strategy-config",
  label: "Strategy Config",
  description: "View and edit configuration for active DeFi strategies.",
  icon: Settings,
  minW: 6,
  minH: 4,
  defaultW: 8,
  defaultH: 6,
  requiredEntitlements: [{ domain: "trading-defi", tier: "basic" }],
  category: "DeFi",
  availableOn: ["defi"],
  singleton: true,
  component: DeFiStrategyConfigWidget,
});

registerWidget({
  id: "defi-staking-rewards",
  label: "Staking Rewards",
  description: "Track, claim, and sell staking rewards (EIGEN, ETHFI). Reward P&L attribution.",
  icon: Gift,
  minW: 6,
  minH: 4,
  defaultW: 8,
  defaultH: 6,
  requiredEntitlements: [{ domain: "trading-defi", tier: "basic" }],
  category: "DeFi",
  availableOn: ["defi"],
  singleton: true,
  component: DeFiStakingRewardsWidget,
});

registerWidget({
  id: "defi-funding-matrix",
  label: "Funding Rate Matrix",
  description: "Per-coin-per-venue annualised funding rates with floor highlighting.",
  icon: DollarSign,
  minW: 8,
  minH: 3,
  defaultW: 16,
  defaultH: 5,
  requiredEntitlements: [{ domain: "trading-defi", tier: "basic" }],
  category: "DeFi",
  availableOn: ["defi"],
  singleton: true,
  component: DeFiFundingMatrixWidget,
});

registerWidget({
  id: "defi-waterfall-weights",
  label: "Allocation Weights",
  description: "Two-waterfall allocation: coin weights (Pillar 1) and per-coin venue weights (Pillar 2).",
  icon: Layers,
  minW: 6,
  minH: 4,
  defaultW: 8,
  defaultH: 6,
  requiredEntitlements: [{ domain: "trading-defi", tier: "basic" }],
  category: "DeFi",
  availableOn: ["defi"],
  singleton: true,
  component: DeFiWaterfallWeightsWidget,
});

registerWidget({
  id: "defi-health-factor",
  label: "Health Factor Monitor",
  description: "Real-time HF monitoring with oracle/market rates, spread analysis, and emergency exit.",
  icon: Heart,
  minW: 6,
  minH: 5,
  defaultW: 8,
  defaultH: 8,
  requiredEntitlements: [{ domain: "trading-defi", tier: "basic" }],
  category: "DeFi",
  availableOn: ["defi"],
  singleton: true,
  component: DeFiHealthFactorWidget,
});

registerWidget({
  id: "defi-reward-pnl",
  label: "Reward P&L Breakdown",
  description: "P&L decomposition by reward factor: staking yield, restaking, seasonal, unrealised.",
  icon: BarChart3,
  minW: 6,
  minH: 4,
  defaultW: 8,
  defaultH: 6,
  requiredEntitlements: [{ domain: "trading-defi", tier: "basic" }],
  category: "DeFi",
  availableOn: ["defi"],
  singleton: true,
  component: DeFiRewardPnlWidget,
});

registerWidget({
  id: "defi-yield-chart",
  label: "Yield Performance",
  description: "Time-series yield curves, cumulative P&L, and APY comparison across all DeFi strategies.",
  icon: BarChart3,
  minW: 12,
  minH: 5,
  defaultW: 24,
  defaultH: 7,
  requiredEntitlements: [{ domain: "trading-defi", tier: "basic" }],
  category: "DeFi",
  availableOn: ["defi"],
  singleton: true,
  component: DeFiYieldChartWidget,
});

registerWidget({
  id: "enhanced-basis-dashboard",
  label: "Enhanced Basis Dashboard",
  description:
    "Cross-venue spot/perp basis comparison with funding rates, annualised yield, and best opportunity highlighting.",
  icon: TrendingUp,
  minW: 8,
  minH: 4,
  defaultW: 12,
  defaultH: 6,
  requiredEntitlements: [{ domain: "trading-defi", tier: "basic" }],
  category: "DeFi",
  availableOn: ["defi", "strategies"],
  singleton: true,
  component: EnhancedBasisWidget,
});
