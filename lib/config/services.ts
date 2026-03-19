/**
 * Service Registry Configuration
 * 
 * Service definitions with entitlement requirements.
 * Source: REFACTORING_PLAN §2.1, lib/registry/system-topology.json
 */

import type { Entitlement } from "./auth"

// Service definition interface
export interface ServiceDefinition {
  id: string
  name: string
  description: string
  tier: 1 | 2 | 3  // 1=core, 2=important, 3=standard
  type: "api" | "service" | "batch" | "ui" | "library"
  requiredEntitlements: Entitlement[]
  internalOnly: boolean
  routes: string[]  // App routes that use this service
  endpoints: string[]  // API endpoints
}

// Service registry
export const SERVICES: Record<string, ServiceDefinition> = {
  // Core Trading Services
  "data-service": {
    id: "data-service",
    name: "Data Service",
    description: "Instrument registry, catalogue, subscriptions, and data availability",
    tier: 1,
    type: "api",
    requiredEntitlements: ["data-basic"],
    internalOnly: false,
    routes: ["/admin/data", "/markets"],
    endpoints: ["/data/instruments", "/data/catalogue", "/data/subscriptions"],
  },
  
  "execution-service": {
    id: "execution-service",
    name: "Execution Service",
    description: "Order routing, fills, algo execution",
    tier: 1,
    type: "api",
    requiredEntitlements: ["execution-basic"],
    internalOnly: false,
    routes: ["/execution", "/execution/algos", "/execution/venues"],
    endpoints: ["/execution/orders", "/execution/fills", "/execution/algos"],
  },
  
  "position-service": {
    id: "position-service",
    name: "Position & Balance Service",
    description: "Position tracking, margin, historical positions",
    tier: 1,
    type: "api",
    requiredEntitlements: ["execution-basic"],
    internalOnly: false,
    routes: ["/positions"],
    endpoints: ["/positions", "/positions/by-venue", "/positions/margin"],
  },
  
  "strategy-service": {
    id: "strategy-service",
    name: "Strategy Service",
    description: "Strategy configs, backtests, candidates, deployment",
    tier: 1,
    type: "api",
    requiredEntitlements: ["strategy-full"],
    internalOnly: false,
    routes: ["/strategies", "/strategy-platform"],
    endpoints: ["/strategies", "/strategies/backtests", "/strategies/candidates"],
  },
  
  "ml-service": {
    id: "ml-service",
    name: "ML Service",
    description: "ML models, features, experiments, training, inference",
    tier: 2,
    type: "api",
    requiredEntitlements: ["ml-full"],
    internalOnly: false,
    routes: ["/ml", "/ml/experiments", "/ml/training"],
    endpoints: ["/ml/models", "/ml/features", "/ml/experiments"],
  },
  
  "risk-service": {
    id: "risk-service",
    name: "Risk Service",
    description: "Exposure, limits, VaR, Greeks, stress testing",
    tier: 1,
    type: "api",
    requiredEntitlements: ["execution-basic"],
    internalOnly: false,
    routes: ["/risk"],
    endpoints: ["/risk/exposure", "/risk/limits", "/risk/var"],
  },
  
  "trading-service": {
    id: "trading-service",
    name: "Trading & P&L Service",
    description: "Live P&L, attribution, performance analytics",
    tier: 1,
    type: "api",
    requiredEntitlements: ["execution-basic"],
    internalOnly: false,
    routes: ["/trading", "/markets/pnl"],
    endpoints: ["/trading/pnl", "/trading/attribution", "/trading/performance"],
  },
  
  "market-data-service": {
    id: "market-data-service",
    name: "Market Data Service",
    description: "OHLCV candles, order book snapshots, trades feed",
    tier: 1,
    type: "api",
    requiredEntitlements: ["data-basic"],
    internalOnly: false,
    routes: ["/markets"],
    endpoints: ["/market-data/candles", "/market-data/book", "/market-data/trades"],
  },
  
  // Platform Feature Services
  "alerts-service": {
    id: "alerts-service",
    name: "Alerts Service",
    description: "Alert CRUD, severity filtering, acknowledge/resolve",
    tier: 3,
    type: "api",
    requiredEntitlements: ["data-basic"],
    internalOnly: false,
    routes: ["/alerts"],
    endpoints: ["/alerts", "/alerts/:id/acknowledge", "/alerts/:id/resolve"],
  },
  
  "reporting-service": {
    id: "reporting-service",
    name: "Reporting Service",
    description: "Reports, settlement, reconciliation, invoicing",
    tier: 2,
    type: "api",
    requiredEntitlements: ["reporting"],
    internalOnly: false,
    routes: ["/reports"],
    endpoints: ["/reports", "/reports/settlement", "/reports/reconciliation"],
  },
  
  // Ops/Internal Services
  "deployment-service": {
    id: "deployment-service",
    name: "Deployment Service",
    description: "Service deployments, cloud builds, shards",
    tier: 3,
    type: "api",
    requiredEntitlements: ["ops"],
    internalOnly: true,
    routes: ["/devops", "/ops"],
    endpoints: ["/deployment/services", "/deployment/deployments", "/deployment/shards"],
  },
  
  "service-status-service": {
    id: "service-status-service",
    name: "Service Status Service",
    description: "Service health, feature freshness, system overview",
    tier: 3,
    type: "api",
    requiredEntitlements: ["ops"],
    internalOnly: true,
    routes: ["/health", "/ops/services"],
    endpoints: ["/service-status/health", "/service-status/freshness"],
  },
  
  "audit-service": {
    id: "audit-service",
    name: "Audit Service",
    description: "Compliance checks, event history, data health",
    tier: 3,
    type: "api",
    requiredEntitlements: ["admin"],
    internalOnly: true,
    routes: ["/compliance", "/admin"],
    endpoints: ["/audit/compliance", "/audit/events", "/audit/data-health"],
  },
  
  "user-management-service": {
    id: "user-management-service",
    name: "User Management Service",
    description: "Orgs, users, roles, subscriptions",
    tier: 2,
    type: "api",
    requiredEntitlements: ["admin"],
    internalOnly: false, // clients can see their own org
    routes: ["/manage", "/admin"],
    endpoints: ["/user-management/orgs", "/user-management/users", "/user-management/roles"],
  },
} as const

/**
 * Get services accessible to user based on entitlements
 */
export function getAccessibleServices(entitlements: Entitlement[]): ServiceDefinition[] {
  const hasWildcard = entitlements.includes("*")
  
  return Object.values(SERVICES).filter((service) => {
    if (hasWildcard) return true
    return service.requiredEntitlements.some((e) => entitlements.includes(e))
  })
}

/**
 * Check if user can access a service
 */
export function canAccessService(serviceId: string, entitlements: Entitlement[], isInternal: boolean): boolean {
  const service = SERVICES[serviceId]
  if (!service) return false
  
  if (service.internalOnly && !isInternal) return false
  if (entitlements.includes("*")) return true
  
  return service.requiredEntitlements.some((e) => entitlements.includes(e))
}

/**
 * Get routes accessible to user
 */
export function getAccessibleRoutes(entitlements: Entitlement[], isInternal: boolean): string[] {
  const services = Object.values(SERVICES).filter((s) => 
    canAccessService(s.id, entitlements, isInternal)
  )
  
  return [...new Set(services.flatMap((s) => s.routes))]
}
