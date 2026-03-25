/**
 * Lifecycle Mapping Model
 *
 * Maps routes to lifecycle stages and domain lanes.
 * This is the foundation for the unified navigation shell.
 *
 * Three conceptual layers (not collapsible):
 * 1. Lifecycle: How the platform operates (horizontal flow)
 * 2. Domain Lanes: What moves through the system (vertical swim lanes)
 * 3. Commercial Offerings: How clients buy in (packaged entry points)
 */

// Lifecycle stages - the horizontal flow through the platform
export type LifecycleStage =
  | "acquire" // Data acquisition, coverage, instruments
  | "build" // Research, ML, strategy development, backtesting
  | "promote" // Candidate review, config diff, approval queue
  | "run" // Live trading, order entry, positions
  | "execute" // Execution algos, venue connectivity, TCA
  | "observe" // Risk, alerts, P&L, monitoring
  | "manage" // Clients, mandates, allocations, fees, settings
  | "report"; // Client reports, invoices, regulatory, analytics

// Domain lanes - vertical swim lanes moving through lifecycle
export type DomainLane =
  | "data" // Data coverage, quality, instruments
  | "ml" // Machine learning models, features, signals
  | "strategy" // Strategy development, backtesting, simulation
  | "execution" // Algo execution, venues, TCA
  | "capital" // Client management, mandates, allocations
  | "compliance"; // Regulatory, reporting, audit

// Route mapping structure
export interface RouteMapping {
  path: string;
  label: string;
  primaryStage: LifecycleStage;
  secondaryStage?: LifecycleStage;
  lanes: DomainLane[];
  description?: string;
  requiresAuth?: boolean;
}

// Lifecycle stage metadata
export const lifecycleStages: Record<
  LifecycleStage,
  {
    label: string;
    description: string;
    icon: string;
    color: string;
  }
> = {
  acquire: {
    label: "Data",
    description:
      "Data acquisition, ETL pipelines & venue coverage",
    icon: "Database",
    color: "text-sky-400",
  },
  build: {
    label: "Research",
    description: "Features, ML models, strategies & backtesting",
    icon: "Wrench",
    color: "text-violet-400",
  },
  promote: {
    label: "Promote",
    description: "Strategy review, risk analysis & deployment approval",
    icon: "ArrowUpCircle",
    color: "text-amber-400",
  },
  run: {
    label: "Trading",
    description: "Live trading, positions, orders & account management",
    icon: "Play",
    color: "text-emerald-400",
  },
  execute: {
    label: "Execution",
    description: "Execution algos, venue connectivity & TCA",
    icon: "Zap",
    color: "text-orange-400",
  },
  observe: {
    label: "Observe",
    description: "Risk monitoring, alerts, news & system health",
    icon: "Eye",
    color: "text-cyan-400",
  },
  manage: {
    label: "Manage",
    description: "Clients, mandates, fees & regulatory operations",
    icon: "Settings2",
    color: "text-rose-400",
  },
  report: {
    label: "Reports",
    description: "P&L, settlement, invoicing & compliance reporting",
    icon: "FileText",
    color: "text-slate-400",
  },
};

// Domain lane metadata
export const domainLanes: Record<
  DomainLane,
  {
    label: string;
    description: string;
    color: string;
  }
> = {
  data: {
    label: "Data",
    description: "Market data, instruments, coverage",
    color: "text-sky-400",
  },
  ml: {
    label: "ML",
    description: "Models, features, signals",
    color: "text-violet-400",
  },
  strategy: {
    label: "Strategy",
    description: "Strategy logic, backtesting",
    color: "text-amber-400",
  },
  execution: {
    label: "Execution",
    description: "Algos, venues, TCA",
    color: "text-emerald-400",
  },
  capital: {
    label: "Capital",
    description: "Clients, mandates, allocations",
    color: "text-rose-400",
  },
  compliance: {
    label: "Compliance",
    description: "Regulatory, audit, reporting",
    color: "text-slate-400",
  },
};

// Route to lifecycle mapping — all platform routes use /services/{service}/... prefix
export const routeMappings: RouteMapping[] = [
  // ACQUIRE stage — Data Service
  {
    path: "/services/data/overview",
    label: "Data",
    primaryStage: "acquire",
    lanes: ["data"],
    description: "Pipeline status, venue coverage, freshness",
    requiresAuth: true,
  },

  // BUILD stage — Research & Backtesting Service
  {
    path: "/services/research/overview",
    label: "Research & Backtesting",
    primaryStage: "build",
    lanes: ["ml", "strategy", "execution"],
    description: "ML models, strategy research, execution research",
    requiresAuth: true,
  },
  {
    path: "/services/research/ml",
    label: "ML Models & Training",
    primaryStage: "build",
    lanes: ["ml"],
    requiresAuth: true,
  },
  {
    path: "/services/research/ml/overview",
    label: "ML Dashboard",
    primaryStage: "build",
    lanes: ["ml"],
    requiresAuth: true,
  },
  {
    path: "/services/research/ml/experiments",
    label: "Experiments",
    primaryStage: "build",
    lanes: ["ml"],
    requiresAuth: true,
  },
  {
    path: "/services/research/ml/training",
    label: "Training",
    primaryStage: "build",
    lanes: ["ml"],
    requiresAuth: true,
  },
  {
    path: "/services/research/ml/analysis",
    label: "Analysis",
    primaryStage: "build",
    lanes: ["ml"],
    requiresAuth: true,
  },
  {
    path: "/services/research/ml/features",
    label: "Features",
    primaryStage: "build",
    lanes: ["ml", "data"],
    requiresAuth: true,
  },
  {
    path: "/services/research/ml/validation",
    label: "Validation",
    primaryStage: "build",
    secondaryStage: "promote",
    lanes: ["ml"],
    requiresAuth: true,
  },
  {
    path: "/services/research/ml/registry",
    label: "Model Registry",
    primaryStage: "build",
    secondaryStage: "promote",
    lanes: ["ml"],
    requiresAuth: true,
  },
  {
    path: "/services/research/ml/monitoring",
    label: "Model Monitoring",
    primaryStage: "observe",
    lanes: ["ml"],
    requiresAuth: true,
  },
  {
    path: "/services/research/ml/deploy",
    label: "Model Deploy",
    primaryStage: "promote",
    lanes: ["ml"],
    requiresAuth: true,
  },
  {
    path: "/services/research/ml/governance",
    label: "ML Governance",
    primaryStage: "manage",
    lanes: ["ml", "compliance"],
    requiresAuth: true,
  },
  {
    path: "/services/research/strategy/backtests",
    label: "Backtests",
    primaryStage: "build",
    lanes: ["strategy"],
    requiresAuth: true,
  },
  {
    path: "/services/research/strategy/compare",
    label: "Compare",
    primaryStage: "build",
    lanes: ["strategy"],
    requiresAuth: true,
  },
  {
    path: "/services/research/strategy/results",
    label: "Results",
    primaryStage: "build",
    lanes: ["strategy"],
    requiresAuth: true,
  },
  {
    path: "/services/research/strategy/heatmap",
    label: "Heatmap",
    primaryStage: "build",
    lanes: ["strategy"],
    requiresAuth: true,
  },
  {
    path: "/services/research/strategy/candidates",
    label: "Strategy Candidates",
    primaryStage: "promote",
    lanes: ["strategy"],
    requiresAuth: true,
  },
  {
    path: "/services/research/strategy/handoff",
    label: "Strategy Handoff",
    primaryStage: "promote",
    lanes: ["strategy"],
    requiresAuth: true,
  },
  {
    path: "/services/execution/algos",
    label: "Algo Comparison",
    primaryStage: "build",
    lanes: ["execution"],
    requiresAuth: true,
  },
  {
    path: "/services/execution/venues",
    label: "Venues",
    primaryStage: "build",
    secondaryStage: "acquire",
    lanes: ["execution", "data"],
    requiresAuth: true,
  },
  {
    path: "/services/execution/tca",
    label: "TCA",
    primaryStage: "observe",
    lanes: ["execution"],
    requiresAuth: true,
  },
  {
    path: "/services/execution/benchmarks",
    label: "Benchmarks",
    primaryStage: "build",
    lanes: ["execution"],
    requiresAuth: true,
  },

  // PROMOTE stage
  {
    path: "/config",
    label: "Config",
    primaryStage: "promote",
    secondaryStage: "manage",
    lanes: ["strategy", "execution"],
    requiresAuth: true,
  },

  // RUN stage — Trading Service
  {
    path: "/dashboard",
    label: "Command Center",
    primaryStage: "run",
    lanes: ["execution", "strategy", "capital"],
    description: "KPIs, P&L, alerts, risk limits, service health",
    requiresAuth: true,
  },
  {
    path: "/services/trading/overview",
    label: "Trading Overview",
    primaryStage: "run",
    lanes: ["execution"],
    description: "Command center — P&L, strategies, alerts",
    requiresAuth: true,
  },
  {
    path: "/services/trading/terminal",
    label: "Terminal",
    primaryStage: "run",
    lanes: ["execution"],
    description: "Live trading — charts, order book, order entry",
    requiresAuth: true,
  },
  {
    path: "/services/trading/positions",
    label: "Positions",
    primaryStage: "run",
    secondaryStage: "observe",
    lanes: ["execution", "capital"],
    requiresAuth: true,
  },
  {
    path: "/services/trading/orders",
    label: "Orders",
    primaryStage: "run",
    lanes: ["execution"],
    requiresAuth: true,
  },
  {
    path: "/services/trading/book",
    label: "Book Trade",
    primaryStage: "run",
    lanes: ["execution"],
    requiresAuth: true,
  },
  {
    path: "/services/trading/accounts",
    label: "Accounts",
    primaryStage: "run",
    lanes: ["execution", "capital"],
    requiresAuth: true,
  },
  {
    path: "/services/trading/pnl",
    label: "P&L Breakdown",
    primaryStage: "run",
    secondaryStage: "report",
    lanes: ["execution", "capital"],
    requiresAuth: true,
  },
  {
    path: "/services/trading/strategies",
    label: "Strategies",
    primaryStage: "run",
    lanes: ["strategy"],
    requiresAuth: true,
  },
  {
    path: "/services/observe/risk",
    label: "Risk",
    primaryStage: "observe",
    lanes: ["strategy", "execution", "capital"],
    requiresAuth: true,
  },
  {
    path: "/services/observe/alerts",
    label: "Alerts",
    primaryStage: "observe",
    lanes: ["strategy", "execution", "ml"],
    requiresAuth: true,
  },

  // Execution Service (Execute stage)
  {
    path: "/services/execution/overview",
    label: "Execution Analytics",
    primaryStage: "execute",
    lanes: ["execution"],
    description: "Live execution analytics",
    requiresAuth: true,
  },
  {
    path: "/services/execution/algos",
    label: "Algo Comparison",
    primaryStage: "execute",
    lanes: ["execution"],
    requiresAuth: true,
  },
  {
    path: "/services/execution/venues",
    label: "Venues",
    primaryStage: "execute",
    lanes: ["execution", "data"],
    requiresAuth: true,
  },
  {
    path: "/services/execution/tca",
    label: "TCA",
    primaryStage: "execute",
    lanes: ["execution"],
    requiresAuth: true,
  },
  {
    path: "/services/execution/benchmarks",
    label: "Benchmarks",
    primaryStage: "execute",
    lanes: ["execution"],
    requiresAuth: true,
  },
  {
    path: "/services/execution/candidates",
    label: "Candidates",
    primaryStage: "execute",
    lanes: ["execution"],
    requiresAuth: true,
  },
  {
    path: "/services/execution/handoff",
    label: "Handoff",
    primaryStage: "execute",
    lanes: ["execution"],
    requiresAuth: true,
  },

  // OBSERVE stage
  {
    path: "/services/observe/health",
    label: "Health",
    primaryStage: "observe",
    lanes: ["data", "execution"],
    requiresAuth: true,
  },
  {
    path: "/ops",
    label: "Operations",
    primaryStage: "observe",
    secondaryStage: "manage",
    lanes: ["execution", "data"],
    requiresAuth: true,
  },

  // MANAGE stage
  {
    path: "/services/manage/clients",
    label: "Clients",
    primaryStage: "manage",
    lanes: ["capital"],
    requiresAuth: true,
  },
  {
    path: "/services/manage/mandates",
    label: "Mandates",
    primaryStage: "manage",
    lanes: ["capital", "compliance"],
    requiresAuth: true,
  },
  {
    path: "/services/manage/fees",
    label: "Fees",
    primaryStage: "manage",
    lanes: ["capital"],
    requiresAuth: true,
  },
  {
    path: "/services/manage/users",
    label: "Users",
    primaryStage: "manage",
    lanes: ["compliance"],
    requiresAuth: true,
  },
  {
    path: "/approvals",
    label: "Approvals",
    primaryStage: "manage",
    lanes: ["compliance"],
    requiresAuth: true,
  },
  {
    path: "/admin",
    label: "Admin",
    primaryStage: "manage",
    lanes: ["compliance"],
    requiresAuth: true,
  },
  {
    path: "/services/manage/compliance",
    label: "Compliance",
    primaryStage: "manage",
    lanes: ["compliance"],
    requiresAuth: true,
  },

  // REPORT stage — Reports Service
  {
    path: "/services/reports/overview",
    label: "Reports",
    primaryStage: "report",
    lanes: ["capital", "compliance"],
    requiresAuth: true,
  },
  {
    path: "/services/reports/executive",
    label: "Executive",
    primaryStage: "report",
    secondaryStage: "observe",
    lanes: ["capital", "strategy"],
    requiresAuth: true,
  },

  // INVESTOR RELATIONS — presentations, disaster recovery, security
  {
    path: "/investor-relations",
    label: "Investor Relations",
    primaryStage: "report",
    lanes: ["capital", "compliance"],
    requiresAuth: true,
  },
  {
    path: "/investor-relations/board-presentation",
    label: "Board Presentation",
    primaryStage: "report",
    lanes: ["capital"],
    requiresAuth: true,
  },
  {
    path: "/investor-relations/disaster-recovery",
    label: "Disaster Recovery",
    primaryStage: "report",
    lanes: ["compliance"],
    requiresAuth: true,
  },

  // Public/commercial routes (no auth required)
  {
    path: "/",
    label: "Home",
    primaryStage: "acquire",
    lanes: ["data"],
    requiresAuth: false,
  },
  {
    path: "/services/data",
    label: "Data Service",
    primaryStage: "acquire",
    lanes: ["data"],
    requiresAuth: false,
  },
  {
    path: "/services/backtesting",
    label: "Backtesting Service",
    primaryStage: "build",
    lanes: ["strategy"],
    requiresAuth: false,
  },
  {
    path: "/services/execution",
    label: "Execution Service",
    primaryStage: "run",
    lanes: ["execution"],
    requiresAuth: false,
  },
  {
    path: "/services/platform",
    label: "Platform Service",
    primaryStage: "build",
    lanes: ["strategy", "execution", "ml"],
    requiresAuth: false,
  },
  {
    path: "/services/investment",
    label: "Investment Service",
    primaryStage: "manage",
    lanes: ["capital"],
    requiresAuth: false,
  },
  {
    path: "/services/regulatory",
    label: "Regulatory Service",
    primaryStage: "manage",
    lanes: ["compliance"],
    requiresAuth: false,
  },
];

// Get mapping for a specific route
export function getRouteMapping(path: string): RouteMapping | undefined {
  // First try exact match
  const exactMatch = routeMappings.find((m) => m.path === path);
  if (exactMatch) return exactMatch;

  // Try prefix match (for dynamic routes like /services/research/ml/experiments/[id])
  const prefixMatch = routeMappings
    .filter((m) => path.startsWith(m.path + "/"))
    .sort((a, b) => b.path.length - a.path.length)[0];

  return prefixMatch;
}

// Get all routes for a lifecycle stage
export function getRoutesForStage(stage: LifecycleStage): RouteMapping[] {
  return routeMappings.filter(
    (m) => m.primaryStage === stage || m.secondaryStage === stage,
  );
}

// Get all routes for a domain lane
export function getRoutesForLane(lane: DomainLane): RouteMapping[] {
  return routeMappings.filter((m) => m.lanes.includes(lane));
}

// Navigation structure for lifecycle nav
export interface LifecycleNavItem {
  stage: LifecycleStage;
  label: string;
  icon: string;
  color: string;
  items: {
    path: string;
    label: string;
    lanes: DomainLane[];
    description?: string;
  }[];
}

// Build navigation structure — simplified: one primary service link per stage
export function buildLifecycleNav(
  authRequired: boolean = true,
): LifecycleNavItem[] {
  const stages: LifecycleStage[] = [
    "acquire",
    "build",
    "promote",
    "run",
    "execute",
    "observe",
    "manage",
    "report",
  ];

  // Service-centric nav: each stage shows its primary service entry point
  const stageServiceMap: Record<
    LifecycleStage,
    { path: string; label: string; lanes: DomainLane[]; description?: string }[]
  > = {
    acquire: [
      {
        path: "/services/data/overview",
        label: "Data",
        lanes: ["data"],
        description: "Pipeline status, venue coverage, freshness",
      },
    ],
    build: [
      {
        path: "/services/research/overview",
        label: "Research & Backtesting",
        lanes: ["ml", "strategy", "execution"],
        description: "ML models, strategy research, execution research",
      },
    ],
    promote: [
      {
        path: "/services/research/strategy/candidates",
        label: "Strategy Candidates",
        lanes: ["strategy"],
        description: "Review and promote winning strategies",
      },
    ],
    run: [
      {
        path: "/services/trading/overview",
        label: "Trading",
        lanes: ["execution", "strategy", "capital"],
        description: "Overview, terminal, positions, orders",
      },
    ],
    execute: [
      {
        path: "/services/execution/overview",
        label: "Execution Analytics",
        lanes: ["execution"],
        description: "Live execution analytics and venue status",
      },
    ],
    observe: [
      {
        path: "/services/observe/risk",
        label: "Risk",
        lanes: ["strategy", "execution", "capital"],
        description: "Exposure, VaR, Greeks, risk limits",
      },
      {
        path: "/services/observe/alerts",
        label: "Alerts",
        lanes: ["strategy", "execution", "ml"],
        description: "Alert management and notifications",
      },
      {
        path: "/services/observe/health",
        label: "Health",
        lanes: ["data", "execution"],
        description: "Service health dashboard",
      },
    ],
    manage: [
      { path: "/admin", label: "Admin", lanes: ["compliance"] },
      {
        path: "/services/manage/clients",
        label: "Clients",
        lanes: ["capital"],
      },
      {
        path: "/services/manage/compliance",
        label: "Compliance",
        lanes: ["compliance"],
      },
    ],
    report: [
      {
        path: "/services/reports/overview",
        label: "Reports",
        lanes: ["capital", "compliance"],
        description: "P&L attribution, settlement, reconciliation",
      },
      {
        path: "/services/reports/executive",
        label: "Executive Dashboard",
        lanes: ["capital", "strategy"],
      },
    ],
  };

  return stages
    .map((stage) => {
      const stageInfo = lifecycleStages[stage];
      const items = stageServiceMap[stage] || [];

      return {
        stage,
        label: stageInfo.label,
        icon: stageInfo.icon,
        color: stageInfo.color,
        items: authRequired ? items : [],
      };
    })
    .filter((nav) => nav.items.length > 0);
}

// Commercial offering to lifecycle stage mapping
export const commercialToLifecycle: Record<string, LifecycleStage[]> = {
  data: ["acquire"],
  backtesting: ["build"],
  execution: ["promote", "run", "observe"],
  platform: ["build", "promote", "run", "observe"],
  investment: ["manage", "report"],
  regulatory: ["manage", "report"],
};

// Entry point descriptions for landing page
export const entryPoints = [
  {
    id: "data",
    name: "Data Only",
    stages: ["acquire"],
    description: "Access our unified data schema without trading",
    noAlphaExposure: true,
  },
  {
    id: "research",
    name: "Research Tier",
    stages: ["acquire", "build"],
    description: "Data plus backtesting and strategy development",
    noAlphaExposure: false,
  },
  {
    id: "execution",
    name: "Execution Only",
    stages: ["promote", "run", "observe"],
    description: "Bring your own strategies, use our execution",
    noAlphaExposure: true,
  },
  {
    id: "full",
    name: "Full Platform",
    stages: ["acquire", "build", "promote", "run", "observe"],
    description: "Complete access to all platform capabilities",
    noAlphaExposure: false,
  },
  {
    id: "investment",
    name: "Investment Management",
    stages: ["manage", "report"],
    description: "We manage capital on your behalf",
    noAlphaExposure: true,
  },
];
