/**
 * Trading route path → short label for breadcrumbs and `getRouteMapping` fallback.
 * Keep in sync with `TRADING_TABS` in `components/shell/service-tabs.tsx` (href + label).
 */

const TRADING_BASE = "/services/trading";

/** Longest match wins — order in this array is not significant. */
const TRADING_NAV_PATH_LABELS: { path: string; label: string }[] = [
  { path: "/services/trading/predictions/aggregators", label: "Aggregators" },
  { path: "/services/trading/options/pricing", label: "Pricing" },
  { path: "/services/trading/options/combos", label: "Combo Builder" },
  { path: "/services/trading/sports/accumulators", label: "Accumulators" },
  { path: "/services/trading/sports/bet", label: "Place Bets" },
  { path: "/services/trading/defi/staking", label: "Staking" },
  { path: "/services/trading/strategies/model-portfolios", label: "Model Portfolios" },
  { path: "/services/trading/strategies/grid", label: "Grid" },
  { path: "/services/trading/custom", label: "Custom" },
  { path: "/services/trading/predictions", label: "Predictions" },
  { path: "/services/trading/options", label: "Options" },
  { path: "/services/trading/sports", label: "Sports" },
  { path: "/services/trading/defi", label: "DeFi" },
  { path: "/services/trading/bundles", label: "Bundles" },
  { path: "/services/trading/instructions", label: "Instructions" },
  { path: "/services/trading/markets", label: "Markets" },
  { path: "/services/trading/risk", label: "Risk" },
  { path: "/services/trading/alerts", label: "Alerts" },
  { path: "/services/trading/overview", label: "Overview" },
  { path: "/services/trading/terminal", label: "Terminal" },
  { path: "/services/trading/positions/trades", label: "Trades" },
  { path: "/services/trading/positions", label: "Positions" },
  { path: "/services/trading/orders", label: "Orders" },
  { path: "/services/trading/book", label: "Book" },
  { path: "/services/trading/accounts", label: "Accounts" },
  { path: "/services/trading/pnl", label: "P&L" },
  { path: "/services/trading/strategies", label: "Strategies" },
];

const SORTED_TRADING_NAV_LABELS = [...TRADING_NAV_PATH_LABELS].sort((a, b) => b.path.length - a.path.length);

function formatTailSegment(segment: string): string {
  if (!segment) return "Trading";
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
}

/**
 * Human-readable leaf label for a normalized trading path (e.g. sidebar tab name).
 * Used when `routeMappings` has no exact/prefix match (strategy families, alerts, etc.).
 */
export function getTradingNavLeafLabel(normalizedPath: string): string {
  const n = normalizedPath.replace(/\/$/, "") || "/";
  if (n === TRADING_BASE) return "Trading";
  if (!n.startsWith(`${TRADING_BASE}/`)) return "Trading";

  for (const { path, label } of SORTED_TRADING_NAV_LABELS) {
    if (n === path || n.startsWith(`${path}/`)) return label;
  }

  const rest = n.slice(TRADING_BASE.length + 1);
  const tail = rest.split("/").filter(Boolean).pop() ?? "";
  return formatTailSegment(tail);
}

/**
 * Prefix crumbs between "Trading" and the leaf (e.g. `/services/trading/sports/accumulators` → one item: Sports → `/services/trading/sports`).
 * Empty when there is only one segment under `/services/trading` (leaf only).
 */
export function getTradingIntermediateBreadcrumbItems(normalizedPath: string): { href: string; label: string }[] {
  const n = normalizedPath.replace(/\/$/, "") || "/";
  if (n === TRADING_BASE || !n.startsWith(`${TRADING_BASE}/`)) return [];

  const rest = n.slice(TRADING_BASE.length + 1);
  const parts = rest.split("/").filter(Boolean);
  if (parts.length < 2) return [];

  const items: { href: string; label: string }[] = [];
  for (let i = 0; i < parts.length - 1; i++) {
    const prefixPath = `${TRADING_BASE}/${parts.slice(0, i + 1).join("/")}`;
    items.push({
      href: prefixPath,
      label: getTradingNavLeafLabel(prefixPath),
    });
  }
  return items;
}
