import { ArrowRightLeft, Clock, DollarSign, FileText, ShieldCheck, Wallet } from "lucide-react";
import { registerPresets } from "../preset-registry";
import { registerWidget } from "../widget-registry";
import { AccountsBalanceTableWidget } from "./accounts-balance-table-widget";
import { AccountsKpiWidget } from "./accounts-kpi-widget";
import { AccountsMarginUtilWidget } from "./accounts-margin-util-widget";
import { AccountsTransferHistoryWidget } from "./accounts-transfer-history-widget";
import { AccountsTransferWidget } from "./accounts-transfer-widget";
import { SaftPortfolioWidget } from "./saft-portfolio-widget";

registerPresets("accounts", [
  {
    id: "accounts-default",
    name: "Default",
    tab: "accounts",
    isPreset: true,
    layouts: [
      { widgetId: "accounts-kpi-strip", instanceId: "accounts-kpi-strip-1", x: 0, y: 0, w: 24, h: 2 },
      { widgetId: "accounts-balance-table", instanceId: "accounts-balance-table-1", x: 0, y: 2, w: 16, h: 5 },
      { widgetId: "accounts-transfer", instanceId: "accounts-transfer-1", x: 16, y: 2, w: 8, h: 7 },
      { widgetId: "accounts-margin-util", instanceId: "accounts-margin-util-1", x: 0, y: 7, w: 16, h: 4 },
      {
        widgetId: "accounts-transfer-history",
        instanceId: "accounts-transfer-history-1",
        x: 0,
        y: 11,
        w: 24,
        h: 4,
      },
      {
        widgetId: "saft-portfolio",
        instanceId: "saft-portfolio-1",
        x: 0,
        y: 15,
        w: 24,
        h: 16,
      },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "accounts-full",
    name: "Full",
    tab: "accounts",
    isPreset: true,
    layouts: [
      { widgetId: "accounts-kpi-strip", instanceId: "accounts-kpi-strip-full", x: 0, y: 0, w: 24, h: 2 },
      { widgetId: "accounts-balance-table", instanceId: "accounts-balance-table-full", x: 0, y: 2, w: 24, h: 5 },
      { widgetId: "accounts-margin-util", instanceId: "accounts-margin-util-full", x: 0, y: 7, w: 24, h: 4 },
      { widgetId: "accounts-transfer", instanceId: "accounts-transfer-full", x: 0, y: 11, w: 8, h: 7 },
      { widgetId: "accounts-transfer-history", instanceId: "accounts-transfer-history-full", x: 8, y: 11, w: 16, h: 4 },
      { widgetId: "saft-portfolio", instanceId: "saft-portfolio-full", x: 0, y: 18, w: 24, h: 20 },
    ],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
]);

registerWidget({
  id: "accounts-kpi-strip",
  label: "NAV Summary",
  description: "Total NAV, available (free), and locked (in use) across venues.",
  icon: DollarSign,
  minW: 6,
  minH: 1,
  defaultW: 24,
  defaultH: 2,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  category: "Accounts",
  availableOn: ["accounts"],
  singleton: true,
  component: AccountsKpiWidget,
});

registerWidget({
  id: "accounts-balance-table",
  label: "Per-Venue Balances",
  description: "Free, locked, total, margin, and utilization per venue.",
  icon: Wallet,
  minW: 12,
  minH: 3,
  defaultW: 24,
  defaultH: 5,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  category: "Accounts",
  availableOn: ["accounts"],
  singleton: true,
  component: AccountsBalanceTableWidget,
});

registerWidget({
  id: "accounts-margin-util",
  label: "Margin Utilization",
  description: "Margin utilization bars, trend, and margin-call distance per venue.",
  icon: ShieldCheck,
  minW: 8,
  minH: 3,
  defaultW: 24,
  defaultH: 4,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  category: "Accounts",
  availableOn: ["accounts"],
  singleton: true,
  component: AccountsMarginUtilWidget,
});

registerWidget({
  id: "accounts-transfer",
  label: "Transfer Panel",
  description: "Venue-to-venue, sub-account, withdraw, and deposit flows.",
  icon: ArrowRightLeft,
  minW: 6,
  minH: 4,
  defaultW: 8,
  defaultH: 7,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  category: "Accounts",
  availableOn: ["accounts"],
  singleton: true,
  component: AccountsTransferWidget,
});

registerWidget({
  id: "accounts-transfer-history",
  label: "Transfer History",
  description: "Recent transfers with status and transaction references.",
  icon: Clock,
  minW: 8,
  minH: 3,
  defaultW: 16,
  defaultH: 4,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  category: "Accounts",
  availableOn: ["accounts"],
  singleton: true,
  component: AccountsTransferHistoryWidget,
});

registerWidget({
  id: "saft-portfolio",
  label: "SAFT & Token Warrants",
  description: "Simple Agreement for Future Tokens — portfolio, vesting timeline, and treasury tracking (demo data).",
  icon: FileText,
  minW: 12,
  minH: 8,
  defaultW: 24,
  defaultH: 20,
  requiredEntitlements: [{ domain: "trading-common", tier: "basic" }],
  category: "Accounts",
  availableOn: ["accounts"],
  singleton: true,
  component: SaftPortfolioWidget,
});
