/**
 * Single source of truth for Tier 0 Playwright route coverage.
 * Used by static-smoke + tier0-app-route-coverage audit.
 *
 * When you add a new static-segment page.tsx under app/, add the URL here or CI fails.
 */

export type Tier0Route = { path: string; name: string };

export const PUBLIC_PAGES: Tier0Route[] = [
  { path: "/", name: "Home (Landing)" },
  { path: "/login", name: "Login" },
  { path: "/signup", name: "Sign Up" },
  { path: "/contact", name: "Contact" },
  { path: "/docs", name: "Docs" },
  { path: "/demo", name: "Demo" },
  { path: "/demo/preview", name: "Demo Preview" },
  { path: "/privacy", name: "Privacy Policy" },
  { path: "/terms", name: "Terms of Service" },
  { path: "/health", name: "Health Check" },
];

export const PUBLIC_MARKETING_PAGES: Tier0Route[] = [
  { path: "/services/platform", name: "Marketing Platform" },
  { path: "/services/investment", name: "Marketing Investment" },
  { path: "/services/backtesting", name: "Marketing Backtesting" },
  { path: "/services/regulatory", name: "Marketing Regulatory" },
];

export const PLATFORM_PAGES: Tier0Route[] = [
  { path: "/dashboard", name: "Dashboard (Service Hub)" },
  { path: "/settings", name: "Settings" },
  { path: "/investor-relations", name: "Investor Relations" },
];

export const INVESTOR_SUBPAGES: Tier0Route[] = [
  {
    path: "/investor-relations/board-presentation",
    name: "IR Board Presentation",
  },
  {
    path: "/investor-relations/disaster-recovery",
    name: "IR Disaster Recovery",
  },
];

export const DATA_PAGES: Tier0Route[] = [
  { path: "/services/data", name: "Data Hub" },
  { path: "/services/data/overview", name: "Data Overview" },
  { path: "/services/data/coverage", name: "Data Coverage" },
  { path: "/services/data/venues", name: "Data Venues" },
  { path: "/services/data/logs", name: "Data Logs" },
  { path: "/services/data/missing", name: "Data Missing" },
  { path: "/services/data/markets/pnl", name: "Data Markets PnL" },
];

export const RESEARCH_PAGES: Tier0Route[] = [
  { path: "/services/research/overview", name: "Research Overview" },
  { path: "/services/research/quant", name: "Quant Workspace" },
  { path: "/services/research/ml", name: "ML Dashboard" },
  { path: "/services/research/ml/overview", name: "ML Overview" },
  { path: "/services/research/ml/experiments", name: "ML Experiments" },
  { path: "/services/research/ml/training", name: "ML Training" },
  { path: "/services/research/ml/features", name: "ML Features" },
  { path: "/services/research/ml/validation", name: "ML Validation" },
  { path: "/services/research/ml/registry", name: "ML Registry" },
  { path: "/services/research/ml/monitoring", name: "ML Monitoring" },
  { path: "/services/research/ml/deploy", name: "ML Deploy" },
  { path: "/services/research/ml/governance", name: "ML Governance" },
  { path: "/services/research/ml/config", name: "ML Config" },
  { path: "/services/research/strategy/overview", name: "Strategy Overview" },
  { path: "/services/research/strategy/backtests", name: "Strategy Backtests" },
  {
    path: "/services/research/strategy/candidates",
    name: "Strategy Candidates",
  },
  { path: "/services/research/strategy/compare", name: "Strategy Compare" },
  { path: "/services/research/strategy/handoff", name: "Strategy Handoff" },
  { path: "/services/research/strategy/heatmap", name: "Strategy Heatmap" },
  { path: "/services/research/strategy/results", name: "Strategy Results" },
];

export const RESEARCH_PAGES_EXTRA: Tier0Route[] = [
  { path: "/services/research/features", name: "Research Features" },
  { path: "/services/research/signals", name: "Research Signals" },
];

export const ML_EXPERIMENT_DETAIL_PAGES: Tier0Route[] = [
  {
    path: "/services/research/ml/experiments/exp-456",
    name: "ML Experiment Detail",
  },
];

export const TRADING_PAGES: Tier0Route[] = [
  {
    path: "/services/trading/overview",
    name: "Trading Overview (Command Center)",
  },
  { path: "/services/trading/terminal", name: "Trading Terminal" },
  { path: "/services/trading/positions", name: "Trading Positions" },
  { path: "/services/trading/orders", name: "Trading Orders" },
  { path: "/services/trading/book", name: "Book Trade" },
  { path: "/services/trading/accounts", name: "Trading Accounts" },
  { path: "/services/trading/pnl", name: "Trading P&L Breakdown" },
  { path: "/services/trading/alerts", name: "Trading Alerts" },
  { path: "/services/trading/risk", name: "Trading Risk" },
  { path: "/services/trading/strategies", name: "Trading Strategies" },
  { path: "/services/trading/strategies/grid", name: "Strategy Grid" },
];

export const STRATEGY_DETAIL_PAGES: Tier0Route[] = [
  {
    path: "/services/trading/strategies/DEFI_ETH_BASIS_SCE_1H",
    name: "Strategy Detail (registry sample)",
  },
];

export const TRADING_PAGES_EXTRA: Tier0Route[] = [
  { path: "/services/trading/options", name: "Trading Options" },
  { path: "/services/trading/predictions", name: "Trading Predictions" },
  { path: "/services/trading/sports", name: "Trading Sports" },
  { path: "/services/trading/defi", name: "Trading DeFi" },
  { path: "/services/trading/bundles", name: "Trading Bundles" },
  { path: "/services/trading/instructions", name: "Trading Instructions" },
];

export const EXECUTION_PAGES: Tier0Route[] = [
  { path: "/services/execution/overview", name: "Execution Overview" },
  { path: "/services/execution/algos", name: "Execution Algos" },
  { path: "/services/execution/venues", name: "Execution Venues" },
  { path: "/services/execution/tca", name: "Execution TCA" },
  { path: "/services/execution/benchmarks", name: "Execution Benchmarks" },
  { path: "/services/execution/candidates", name: "Execution Candidates" },
  { path: "/services/execution/handoff", name: "Execution Handoff" },
];

export const OBSERVE_PAGES: Tier0Route[] = [
  { path: "/services/observe/risk", name: "Observe Risk Dashboard" },
  { path: "/services/observe/alerts", name: "Observe Alerts" },
  { path: "/services/observe/health", name: "Observe System Health" },
  { path: "/services/observe/news", name: "Observe News" },
  {
    path: "/services/observe/strategy-health",
    name: "Observe Strategy Health",
  },
];

export const MANAGE_PAGES: Tier0Route[] = [
  { path: "/services/manage/clients", name: "Manage Clients" },
  { path: "/services/manage/mandates", name: "Manage Mandates" },
  { path: "/services/manage/fees", name: "Manage Fees" },
  { path: "/services/manage/users", name: "Manage Users" },
  { path: "/services/manage/compliance", name: "Manage Compliance" },
];

export const MANAGE_PAGES_EXTRA: Tier0Route[] = [
  {
    path: "/services/manage/users/request",
    name: "Manage User Access Request",
  },
];

export const ADMIN_USER_STATIC_PAGES: Tier0Route[] = [
  { path: "/admin/users", name: "Admin Users" },
  { path: "/admin/users/onboard", name: "Admin Users Onboard" },
  { path: "/admin/users/catalogue", name: "Admin Users Catalogue" },
  { path: "/admin/users/requests", name: "Admin Users Requests" },
  { path: "/admin/users/admin", name: "Admin User Detail (admin)" },
  { path: "/admin/users/admin/modify", name: "Admin User Modify" },
  { path: "/admin/users/admin/offboard", name: "Admin User Offboard" },
];

export const REPORTS_PAGES: Tier0Route[] = [
  { path: "/services/reports/overview", name: "Reports Overview" },
  { path: "/services/reports/executive", name: "Reports Executive" },
  { path: "/services/reports/settlement", name: "Reports Settlement" },
  { path: "/services/reports/reconciliation", name: "Reports Reconciliation" },
  { path: "/services/reports/regulatory", name: "Reports Regulatory" },
];

export const OPS_PAGES: Tier0Route[] = [
  { path: "/admin", name: "Admin" },
  { path: "/admin/data", name: "Admin Data" },
  { path: "/config", name: "Config" },
  { path: "/devops", name: "DevOps" },
  { path: "/engagement", name: "Engagement" },
  { path: "/internal", name: "Internal" },
  { path: "/internal/data-etl", name: "Internal Data ETL" },
  { path: "/ops", name: "Operations" },
  { path: "/ops/jobs", name: "Ops Jobs" },
  { path: "/ops/services", name: "Ops Services" },
];

/** All routes hit by static-smoke (Tier 0). */
export const ALL_TIER0_ROUTES: Tier0Route[] = [
  ...PUBLIC_PAGES,
  ...PUBLIC_MARKETING_PAGES,
  ...PLATFORM_PAGES,
  ...INVESTOR_SUBPAGES,
  ...DATA_PAGES,
  ...RESEARCH_PAGES,
  ...RESEARCH_PAGES_EXTRA,
  ...ML_EXPERIMENT_DETAIL_PAGES,
  ...TRADING_PAGES,
  ...TRADING_PAGES_EXTRA,
  ...STRATEGY_DETAIL_PAGES,
  ...EXECUTION_PAGES,
  ...OBSERVE_PAGES,
  ...MANAGE_PAGES,
  ...MANAGE_PAGES_EXTRA,
  ...REPORTS_PAGES,
  ...ADMIN_USER_STATIC_PAGES,
  ...OPS_PAGES,
];

export const TIER0_REGISTRY_PATHS: string[] = ALL_TIER0_ROUTES.map(
  (r) => r.path,
);

/**
 * Registry entries that do not correspond to a single static page.tsx under app/
 * (dynamic segments like [id] — we test a concrete sample URL instead).
 */
export const TIER0_DYNAMIC_SAMPLE_PATHS: ReadonlySet<string> = new Set([
  "/admin/users/admin",
  "/admin/users/admin/modify",
  "/admin/users/admin/offboard",
  "/services/research/ml/experiments/exp-456",
  "/services/trading/strategies/DEFI_ETH_BASIS_SCE_1H",
]);
