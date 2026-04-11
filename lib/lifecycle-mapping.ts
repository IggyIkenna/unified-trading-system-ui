import { DATA_SERVICE_SECTION_LABELS } from "@/lib/config/services/data-service.config";
import { getTradingNavLeafLabel } from "@/lib/config/services/trading-nav-paths.config";
import { routeMappings } from "@/lib/lifecycle-route-mappings";
import type { DomainLane, LifecycleNavItem, LifecycleStage, RouteMapping } from "@/lib/lifecycle-types";

export type { DomainLane, LifecycleNavItem, LifecycleStage, RouteMapping } from "@/lib/lifecycle-types";

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
    description: "Data acquisition, ETL pipelines & venue coverage",
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
function dataServiceSectionLabel(segment: string): string {
  const key = segment as keyof typeof DATA_SERVICE_SECTION_LABELS;
  if (key in DATA_SERVICE_SECTION_LABELS) {
    return DATA_SERVICE_SECTION_LABELS[key];
  }
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
}

// Get mapping for a specific route
export function getRouteMapping(path: string): RouteMapping | undefined {
  const normalized = path.replace(/\/$/, "") || "/";

  // First try exact match
  const exactMatch = routeMappings.find((m) => m.path === normalized);
  if (exactMatch) return exactMatch;

  const DATA_SERVICE_HUB = "/services/data";
  // Avoid `/services/data` hub prefix matching every child (wrong label "Data Service" in breadcrumbs / nav)
  if (normalized === DATA_SERVICE_HUB || normalized.startsWith(`${DATA_SERVICE_HUB}/`)) {
    if (normalized === DATA_SERVICE_HUB) {
      return routeMappings.find((m) => m.path === DATA_SERVICE_HUB);
    }
    const segment = normalized.slice(DATA_SERVICE_HUB.length + 1).split("/")[0];
    if (!segment) {
      return routeMappings.find((m) => m.path === DATA_SERVICE_HUB);
    }
    return {
      path: `${DATA_SERVICE_HUB}/${segment}`,
      label: dataServiceSectionLabel(segment),
      primaryStage: "acquire",
      lanes: ["data"],
      requiresAuth: true,
    };
  }

  // Try prefix match (for dynamic routes like /services/research/ml/experiments/[id])
  const prefixMatch = routeMappings
    .filter((m) => normalized.startsWith(m.path + "/"))
    .sort((a, b) => b.path.length - a.path.length)[0];

  if (prefixMatch) return prefixMatch;

  // Observe sub-routes must keep primaryStage "observe" for lifecycle nav (tabs may outpace explicit mappings).
  const observeBase = "/services/observe";
  if (normalized === observeBase || normalized.startsWith(`${observeBase}/`)) {
    return {
      path: observeBase,
      label: "Observe",
      primaryStage: "observe",
      lanes: ["strategy", "execution", "capital"],
      requiresAuth: true,
    };
  }

  const tradingBase = "/services/trading";
  if (normalized === tradingBase || normalized.startsWith(`${tradingBase}/`)) {
    return {
      path: tradingBase,
      label: getTradingNavLeafLabel(normalized),
      primaryStage: "run",
      lanes: ["execution", "strategy", "capital"],
      requiresAuth: true,
    };
  }

  return undefined;
}

// Get all routes for a lifecycle stage
export function getRoutesForStage(stage: LifecycleStage): RouteMapping[] {
  return routeMappings.filter((m) => m.primaryStage === stage || m.secondaryStage === stage);
}

// Get all routes for a domain lane
export function getRoutesForLane(lane: DomainLane): RouteMapping[] {
  return routeMappings.filter((m) => m.lanes.includes(lane));
}

// Build navigation structure — simplified: one primary service link per stage
export function buildLifecycleNav(authRequired: boolean = true): LifecycleNavItem[] {
  const stages: LifecycleStage[] = ["acquire", "build", "promote", "run", "execute", "observe", "manage", "report"];

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
        label: "Research",
        lanes: ["ml", "strategy", "execution"],
        description: "ML models, strategy research, execution research",
      },
    ],
    promote: [
      {
        path: "/services/promote/pipeline",
        label: "Strategy Promotion",
        lanes: ["strategy", "ml"],
        description: "Review, assess, and approve strategies for live deployment",
      },
      {
        path: "/services/research/strategy/candidates",
        label: "Candidates (Legacy)",
        lanes: ["strategy"],
        description: "Legacy candidate review pipeline",
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
        path: "/services/observe/news",
        label: "News",
        lanes: ["strategy", "execution", "data"],
        description: "Market and strategy news feed",
      },
      {
        path: "/services/observe/strategy-health",
        label: "Strategy Health",
        lanes: ["strategy", "ml"],
        description: "Strategy performance and health signals",
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
