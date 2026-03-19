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
  | "acquire"   // Data acquisition, coverage, instruments
  | "build"     // Research, ML, strategy development, backtesting
  | "promote"   // Candidate review, config diff, approval queue
  | "run"       // Live trading, order entry, positions
  | "observe"   // Risk, alerts, P&L, monitoring
  | "manage"    // Clients, mandates, allocations, fees, settings
  | "report"    // Client reports, invoices, regulatory, analytics

// Domain lanes - vertical swim lanes moving through lifecycle
export type DomainLane = 
  | "data"       // Data coverage, quality, instruments
  | "ml"         // Machine learning models, features, signals
  | "strategy"   // Strategy development, backtesting, simulation
  | "execution"  // Algo execution, venues, TCA
  | "capital"    // Client management, mandates, allocations
  | "compliance" // Regulatory, reporting, audit

// Route mapping structure
export interface RouteMapping {
  path: string
  label: string
  primaryStage: LifecycleStage
  secondaryStage?: LifecycleStage
  lanes: DomainLane[]
  description?: string
  requiresAuth?: boolean
}

// Lifecycle stage metadata
export const lifecycleStages: Record<LifecycleStage, {
  label: string
  description: string
  icon: string
  color: string
}> = {
  acquire: {
    label: "Acquire",
    description: "Data acquisition, coverage, quality",
    icon: "Database",
    color: "text-sky-400",
  },
  build: {
    label: "Build",
    description: "Research, develop, backtest",
    icon: "Wrench",
    color: "text-violet-400",
  },
  promote: {
    label: "Promote",
    description: "Review, approve, deploy",
    icon: "ArrowUpCircle",
    color: "text-amber-400",
  },
  run: {
    label: "Run",
    description: "Execute, trade, manage positions",
    icon: "Play",
    color: "text-emerald-400",
  },
  observe: {
    label: "Observe",
    description: "Monitor, alert, analyse",
    icon: "Eye",
    color: "text-cyan-400",
  },
  manage: {
    label: "Manage",
    description: "Clients, mandates, fees",
    icon: "Settings2",
    color: "text-rose-400",
  },
  report: {
    label: "Report",
    description: "Reports, invoices, regulatory",
    icon: "FileText",
    color: "text-slate-400",
  },
}

// Domain lane metadata
export const domainLanes: Record<DomainLane, {
  label: string
  description: string
  color: string
}> = {
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
}

// Route to lifecycle mapping
// Primary stage is the main lifecycle context
// Secondary stage captures dual-purpose routes
export const routeMappings: RouteMapping[] = [
  // ACQUIRE stage routes
  { path: "/markets", label: "Markets", primaryStage: "acquire", lanes: ["data"], requiresAuth: true },
  { path: "/markets/pnl", label: "P&L Analysis", primaryStage: "observe", secondaryStage: "acquire", lanes: ["data", "capital"], requiresAuth: true },
  { path: "/strategies/instruments", label: "Instruments", primaryStage: "acquire", lanes: ["data"], requiresAuth: true },
  
  // BUILD stage routes - ML Lab
  { path: "/ml", label: "ML Overview", primaryStage: "build", lanes: ["ml"], requiresAuth: true },
  { path: "/ml/overview", label: "ML Dashboard", primaryStage: "build", lanes: ["ml"], requiresAuth: true },
  { path: "/ml/experiments", label: "Experiments", primaryStage: "build", lanes: ["ml"], requiresAuth: true },
  { path: "/ml/training", label: "Training", primaryStage: "build", lanes: ["ml"], requiresAuth: true },
  { path: "/ml/features", label: "Features", primaryStage: "build", lanes: ["ml", "data"], requiresAuth: true },
  { path: "/ml/validation", label: "Validation", primaryStage: "build", secondaryStage: "promote", lanes: ["ml"], requiresAuth: true },
  { path: "/ml/registry", label: "Model Registry", primaryStage: "build", secondaryStage: "promote", lanes: ["ml"], requiresAuth: true },
  { path: "/ml/monitoring", label: "Model Monitoring", primaryStage: "observe", lanes: ["ml"], requiresAuth: true },
  { path: "/ml/deploy", label: "Model Deploy", primaryStage: "promote", lanes: ["ml"], requiresAuth: true },
  { path: "/ml/governance", label: "ML Governance", primaryStage: "manage", lanes: ["ml", "compliance"], requiresAuth: true },
  
  // BUILD stage routes - Strategy Lab
  { path: "/strategy-platform/overview", label: "Strategy Lab", primaryStage: "build", lanes: ["strategy"], requiresAuth: true },
  { path: "/strategy-platform/backtests", label: "Backtests", primaryStage: "build", lanes: ["strategy"], requiresAuth: true },
  { path: "/strategy-platform/compare", label: "Compare", primaryStage: "build", lanes: ["strategy"], requiresAuth: true },
  { path: "/strategy-platform/results", label: "Results", primaryStage: "build", lanes: ["strategy"], requiresAuth: true },
  { path: "/strategy-platform/heatmap", label: "Heatmap", primaryStage: "build", lanes: ["strategy"], requiresAuth: true },
  { path: "/strategy-platform/candidates", label: "Strategy Candidates", primaryStage: "promote", lanes: ["strategy"], requiresAuth: true },
  { path: "/strategy-platform/handoff", label: "Strategy Handoff", primaryStage: "promote", lanes: ["strategy"], requiresAuth: true },
  
  // BUILD stage routes - Execution Lab
  { path: "/execution/overview", label: "Execution Lab", primaryStage: "build", lanes: ["execution"], requiresAuth: true },
  { path: "/execution/algos", label: "Algo Comparison", primaryStage: "build", lanes: ["execution"], requiresAuth: true },
  { path: "/execution/venues", label: "Venues", primaryStage: "build", secondaryStage: "acquire", lanes: ["execution", "data"], requiresAuth: true },
  { path: "/execution/tca", label: "TCA", primaryStage: "observe", lanes: ["execution"], requiresAuth: true },
  { path: "/execution/benchmarks", label: "Benchmarks", primaryStage: "build", lanes: ["execution"], requiresAuth: true },
  { path: "/execution/candidates", label: "Execution Candidates", primaryStage: "promote", lanes: ["execution"], requiresAuth: true },
  { path: "/execution/handoff", label: "Execution Handoff", primaryStage: "promote", lanes: ["execution"], requiresAuth: true },
  
  // PROMOTE stage routes
  { path: "/config", label: "Config", primaryStage: "promote", secondaryStage: "manage", lanes: ["strategy", "execution"], requiresAuth: true },
  
  // RUN stage routes
  { path: "/overview", label: "Overview", primaryStage: "run", secondaryStage: "observe", lanes: ["strategy", "execution"], requiresAuth: true },
  { path: "/trading", label: "Trading", primaryStage: "run", lanes: ["execution"], requiresAuth: true },
  { path: "/positions", label: "Positions", primaryStage: "run", secondaryStage: "observe", lanes: ["execution", "capital"], requiresAuth: true },
  { path: "/strategies", label: "Strategies", primaryStage: "run", secondaryStage: "build", lanes: ["strategy"], requiresAuth: true },
  
  // OBSERVE stage routes
  { path: "/risk", label: "Risk", primaryStage: "observe", lanes: ["strategy", "execution", "capital"], requiresAuth: true },
  { path: "/alerts", label: "Alerts", primaryStage: "observe", lanes: ["strategy", "execution", "ml"], requiresAuth: true },
  { path: "/ops", label: "Operations", primaryStage: "observe", secondaryStage: "manage", lanes: ["execution", "data"], requiresAuth: true },
  { path: "/ops/jobs", label: "Jobs", primaryStage: "observe", lanes: ["data", "ml"], requiresAuth: true },
  { path: "/ops/services", label: "Services", primaryStage: "observe", lanes: ["data", "execution"], requiresAuth: true },
  { path: "/health", label: "Health", primaryStage: "observe", lanes: ["data", "execution"], requiresAuth: true },
  
  // MANAGE stage routes
  { path: "/manage/clients", label: "Clients", primaryStage: "manage", lanes: ["capital"], requiresAuth: true },
  { path: "/manage/mandates", label: "Mandates", primaryStage: "manage", lanes: ["capital", "compliance"], requiresAuth: true },
  { path: "/manage/fees", label: "Fees", primaryStage: "manage", lanes: ["capital"], requiresAuth: true },
  { path: "/manage/users", label: "Users", primaryStage: "manage", lanes: ["compliance"], requiresAuth: true },
  { path: "/admin", label: "Admin", primaryStage: "manage", lanes: ["compliance"], requiresAuth: true },
  { path: "/compliance", label: "Compliance", primaryStage: "manage", lanes: ["compliance"], requiresAuth: true },
  
  // REPORT stage routes
  { path: "/reports", label: "Reports", primaryStage: "report", lanes: ["capital", "compliance"], requiresAuth: true },
  { path: "/executive", label: "Executive", primaryStage: "report", secondaryStage: "observe", lanes: ["capital", "strategy"], requiresAuth: true },
  
  // Public/commercial routes (no auth required)
  { path: "/", label: "Home", primaryStage: "acquire", lanes: ["data"], requiresAuth: false },
  { path: "/services/data", label: "Data Service", primaryStage: "acquire", lanes: ["data"], requiresAuth: false },
  { path: "/services/backtesting", label: "Backtesting Service", primaryStage: "build", lanes: ["strategy"], requiresAuth: false },
  { path: "/services/execution", label: "Execution Service", primaryStage: "run", lanes: ["execution"], requiresAuth: false },
  { path: "/services/platform", label: "Platform Service", primaryStage: "build", lanes: ["strategy", "execution", "ml"], requiresAuth: false },
  { path: "/services/investment", label: "Investment Service", primaryStage: "manage", lanes: ["capital"], requiresAuth: false },
  { path: "/services/regulatory", label: "Regulatory Service", primaryStage: "manage", lanes: ["compliance"], requiresAuth: false },
]

// Get mapping for a specific route
export function getRouteMapping(path: string): RouteMapping | undefined {
  // First try exact match
  const exactMatch = routeMappings.find(m => m.path === path)
  if (exactMatch) return exactMatch
  
  // Try prefix match (for dynamic routes like /strategies/[id])
  const prefixMatch = routeMappings
    .filter(m => path.startsWith(m.path + "/"))
    .sort((a, b) => b.path.length - a.path.length)[0]
  
  return prefixMatch
}

// Get all routes for a lifecycle stage
export function getRoutesForStage(stage: LifecycleStage): RouteMapping[] {
  return routeMappings.filter(m => 
    m.primaryStage === stage || m.secondaryStage === stage
  )
}

// Get all routes for a domain lane
export function getRoutesForLane(lane: DomainLane): RouteMapping[] {
  return routeMappings.filter(m => m.lanes.includes(lane))
}

// Navigation structure for lifecycle nav
export interface LifecycleNavItem {
  stage: LifecycleStage
  label: string
  icon: string
  color: string
  items: {
    path: string
    label: string
    lanes: DomainLane[]
  }[]
}

// Build navigation structure from mappings
export function buildLifecycleNav(authRequired: boolean = true): LifecycleNavItem[] {
  const stages: LifecycleStage[] = ["acquire", "build", "promote", "run", "observe", "manage", "report"]
  
  return stages.map(stage => {
    const stageInfo = lifecycleStages[stage]
    const routes = routeMappings.filter(m => 
      m.primaryStage === stage && 
      (authRequired ? m.requiresAuth : !m.requiresAuth || m.requiresAuth === undefined)
    )
    
    return {
      stage,
      label: stageInfo.label,
      icon: stageInfo.icon,
      color: stageInfo.color,
      items: routes.map(r => ({
        path: r.path,
        label: r.label,
        lanes: r.lanes,
      })),
    }
  }).filter(nav => nav.items.length > 0)
}

// Commercial offering to lifecycle stage mapping
export const commercialToLifecycle: Record<string, LifecycleStage[]> = {
  "data": ["acquire"],
  "backtesting": ["build"],
  "execution": ["promote", "run", "observe"],
  "platform": ["build", "promote", "run", "observe"],
  "investment": ["manage", "report"],
  "regulatory": ["manage", "report"],
}

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
]
