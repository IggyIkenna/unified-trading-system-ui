import { registerWidget } from "../widget-registry";
import { registerPresets } from "../preset-registry";
import { ArrowRightLeft, Clock, DollarSign, ShieldCheck, Wallet } from "lucide-react";
import { AccountsKpiWidget } from "./accounts-kpi-widget";
import { AccountsBalanceTableWidget } from "./accounts-balance-table-widget";
import { AccountsMarginUtilWidget } from "./accounts-margin-util-widget";
import { AccountsTransferWidget } from "./accounts-transfer-widget";
import { AccountsTransferHistoryWidget } from "./accounts-transfer-history-widget";

registerPresets("accounts", [
  {
    id: "accounts-default",
    name: "Default",
    tab: "accounts",
    isPreset: true,
    layouts: [
      { widgetId: "accounts-kpi-strip", instanceId: "accounts-kpi-strip-1", x: 0, y: 0, w: 12, h: 2 },
      { widgetId: "accounts-balance-table", instanceId: "accounts-balance-table-1", x: 0, y: 2, w: 8, h: 5 },
      { widgetId: "accounts-transfer", instanceId: "accounts-transfer-1", x: 8, y: 2, w: 4, h: 7 },
      { widgetId: "accounts-margin-util", instanceId: "accounts-margin-util-1", x: 0, y: 7, w: 8, h: 4 },
      {
        widgetId: "accounts-transfer-history",
        instanceId: "accounts-transfer-history-1",
        x: 0,
        y: 11,
        w: 12,
        h: 4,
      },
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
  minW: 3,
  minH: 1,
  defaultW: 12,
  defaultH: 2,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["accounts"],
  singleton: true,
  component: AccountsKpiWidget,
});

registerWidget({
  id: "accounts-balance-table",
  label: "Per-Venue Balances",
  description: "Free, locked, total, margin, and utilization per venue.",
  icon: Wallet,
  minW: 6,
  minH: 3,
  defaultW: 12,
  defaultH: 5,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["accounts"],
  singleton: true,
  component: AccountsBalanceTableWidget,
});

registerWidget({
  id: "accounts-margin-util",
  label: "Margin Utilization",
  description: "Margin utilization bars, trend, and margin-call distance per venue.",
  icon: ShieldCheck,
  minW: 4,
  minH: 3,
  defaultW: 12,
  defaultH: 4,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["accounts"],
  singleton: true,
  component: AccountsMarginUtilWidget,
});

registerWidget({
  id: "accounts-transfer",
  label: "Transfer Panel",
  description: "Venue-to-venue, sub-account, withdraw, and deposit flows.",
  icon: ArrowRightLeft,
  minW: 3,
  minH: 4,
  defaultW: 4,
  defaultH: 7,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["accounts"],
  singleton: true,
  component: AccountsTransferWidget,
});

registerWidget({
  id: "accounts-transfer-history",
  label: "Transfer History",
  description: "Recent transfers with status and transaction references.",
  icon: Clock,
  minW: 4,
  minH: 3,
  defaultW: 8,
  defaultH: 4,
  requiredEntitlements: ["execution-basic", "execution-full"],
  availableOn: ["accounts"],
  singleton: true,
  component: AccountsTransferHistoryWidget,
});
