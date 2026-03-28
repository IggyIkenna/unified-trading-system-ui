import { registerWidget } from "../widget-registry";
import { registerPresets } from "../preset-registry";
import { ArrowLeftRight, BarChart3, Coins, Droplets, Landmark, Send, Wallet, Zap } from "lucide-react";
import { DeFiWalletSummaryWidget } from "./defi-wallet-summary-widget";
import { DeFiLendingWidget } from "./defi-lending-widget";
import { DeFiSwapWidget } from "./defi-swap-widget";
import { DeFiLiquidityWidget } from "./defi-liquidity-widget";
import { DeFiStakingWidget } from "./defi-staking-widget";
import { DeFiFlashLoansWidget } from "./defi-flash-loans-widget";
import { DeFiTransferWidget } from "./defi-transfer-widget";
import { DeFiRatesOverviewWidget } from "./defi-rates-overview-widget";

registerPresets("defi", [
  {
    id: "defi-default",
    name: "Default",
    tab: "defi",
    isPreset: true,
    layouts: [
      { widgetId: "defi-wallet-summary", instanceId: "defi-wallet-summary-1", x: 0, y: 0, w: 12, h: 2 },
      { widgetId: "defi-lending", instanceId: "defi-lending-1", x: 0, y: 2, w: 4, h: 6 },
      { widgetId: "defi-swap", instanceId: "defi-swap-1", x: 4, y: 2, w: 4, h: 6 },
      { widgetId: "defi-staking", instanceId: "defi-staking-1", x: 8, y: 2, w: 4, h: 6 },
      { widgetId: "defi-rates-overview", instanceId: "defi-rates-overview-1", x: 0, y: 8, w: 8, h: 4 },
      { widgetId: "defi-transfer", instanceId: "defi-transfer-1", x: 8, y: 8, w: 4, h: 4 },
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
      { widgetId: "defi-wallet-summary", instanceId: "defi-wallet-summary-adv", x: 0, y: 0, w: 12, h: 2 },
      { widgetId: "defi-flash-loans", instanceId: "defi-flash-loans-1", x: 0, y: 2, w: 6, h: 7 },
      { widgetId: "defi-liquidity", instanceId: "defi-liquidity-1", x: 6, y: 2, w: 6, h: 7 },
      { widgetId: "defi-lending", instanceId: "defi-lending-adv", x: 0, y: 9, w: 4, h: 5 },
      { widgetId: "defi-swap", instanceId: "defi-swap-adv", x: 4, y: 9, w: 4, h: 5 },
      { widgetId: "defi-staking", instanceId: "defi-staking-adv", x: 8, y: 9, w: 4, h: 5 },
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
  minW: 3,
  minH: 2,
  defaultW: 4,
  defaultH: 2,
  requiredEntitlements: ["execution-basic", "execution-full"],
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
  minW: 3,
  minH: 4,
  defaultW: 4,
  defaultH: 6,
  requiredEntitlements: ["execution-basic", "execution-full"],
  category: "DeFi",
  availableOn: ["defi"],
  singleton: true,
  component: DeFiLendingWidget,
});

registerWidget({
  id: "defi-swap",
  label: "DeFi Swap",
  description: "Token pair, amount, slippage, route with price impact and gas.",
  icon: ArrowLeftRight,
  minW: 3,
  minH: 4,
  defaultW: 4,
  defaultH: 6,
  requiredEntitlements: ["execution-basic", "execution-full"],
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
  minW: 3,
  minH: 5,
  defaultW: 4,
  defaultH: 7,
  requiredEntitlements: ["execution-basic", "execution-full"],
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
  minW: 3,
  minH: 4,
  defaultW: 4,
  defaultH: 6,
  requiredEntitlements: ["execution-basic", "execution-full"],
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
  minW: 4,
  minH: 5,
  defaultW: 6,
  defaultH: 7,
  requiredEntitlements: ["execution-basic", "execution-full"],
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
  minW: 3,
  minH: 4,
  defaultW: 4,
  defaultH: 6,
  requiredEntitlements: ["execution-basic", "execution-full"],
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
  minW: 4,
  minH: 3,
  defaultW: 8,
  defaultH: 4,
  requiredEntitlements: ["execution-basic", "execution-full"],
  category: "DeFi",
  availableOn: ["defi"],
  singleton: true,
  component: DeFiRatesOverviewWidget,
});
