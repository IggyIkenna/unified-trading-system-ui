/**
 * System-health service catalogue — the 67 backend repos grouped by domain.
 *
 * Sourced from `unified-trading-pm/workspace-manifest.json` +
 * `unified-trading-pm/codex/05-infrastructure/runtime-tiers-and-deployment.md`.
 *
 * This is the MOCK-FRIENDLY client-side manifest consumed by
 * /admin/system-health. A real `/api/v1/services/system-health` aggregator
 * should supersede this; wire via `useSystemHealth()` hook (see follow-up).
 *
 * Used only as a render shape — do not import into services that have the
 * authoritative UAC `service_registry`.
 */
export type ServiceDomain = "core" | "sports" | "cefi" | "tradfi" | "defi" | "prediction" | "ui";

export type ServiceTier = 0 | 1 | 2 | 3;

export interface SystemHealthService {
  /** Repo / service key. */
  key: string;
  /** Display label. */
  label: string;
  /** Domain grouping. */
  domain: ServiceDomain;
  /** Runtime tier (0-3) at its current deployment. */
  tier: ServiceTier;
  /** Short one-liner for the drill-down row. */
  description: string;
}

export const SYSTEM_HEALTH_DOMAIN_LABELS: Record<ServiceDomain, string> = {
  core: "Core Libraries & Platform",
  sports: "Sports Category",
  cefi: "CeFi Category",
  tradfi: "TradFi Category",
  defi: "DeFi Category",
  prediction: "Prediction Category",
  ui: "UI Surfaces",
};

export const SYSTEM_HEALTH_SERVICES: readonly SystemHealthService[] = [
  // ─── Core Libraries & Platform ─────────────────────────────────────────────
  {
    key: "unified-api-contracts",
    label: "unified-api-contracts (UAC)",
    domain: "core",
    tier: 0,
    description: "Canonical domain contracts + Citadel facades.",
  },
  {
    key: "unified-trading-library",
    label: "unified-trading-library (UTL)",
    domain: "core",
    tier: 0,
    description: "Shared library — events, ML, feature_calculator, domain_client.",
  },
  {
    key: "unified-cloud-interface",
    label: "unified-cloud-interface (UCI)",
    domain: "core",
    tier: 0,
    description: "Provider-agnostic cloud SDK wrapper.",
  },
  {
    key: "unified-config-interface",
    label: "unified-config-interface",
    domain: "core",
    tier: 0,
    description: "Typed config loaders + UnifiedCloudConfig.",
  },
  {
    key: "unified-features-interface",
    label: "unified-features-interface (UFI)",
    domain: "core",
    tier: 0,
    description: "Feature store client + registry.",
  },
  {
    key: "unified-events-interface",
    label: "unified-events-interface (UEI)",
    domain: "core",
    tier: 0,
    description: "Event schema + event bus client.",
  },
  {
    key: "unified-reference-data-interface",
    label: "unified-reference-data-interface (URDI)",
    domain: "core",
    tier: 0,
    description: "Sports reference data client.",
  },
  {
    key: "deployment-service",
    label: "deployment-service",
    domain: "core",
    tier: 2,
    description: "Orchestration — VMs, tarball deploys, Cloud Run.",
  },
  {
    key: "deployment-api",
    label: "deployment-api",
    domain: "core",
    tier: 1,
    description: "Deployment-ui backend — data-status, drilldowns, CSV downloads.",
  },
  {
    key: "instruments-service",
    label: "instruments-service",
    domain: "core",
    tier: 2,
    description: "Reference data — 67-venue instrument catalogue + FIXTURES.",
  },
  {
    key: "market-tick-data-service",
    label: "market-tick-data-service (MTDS)",
    domain: "core",
    tier: 2,
    description: "Tick + candle capture across all venues.",
  },
  {
    key: "position-balance-monitor-service",
    label: "position-balance-monitor-service (PBMS)",
    domain: "core",
    tier: 2,
    description: "Position + balance reconciliation; treasury monitor.",
  },
  {
    key: "risk-and-exposure-service",
    label: "risk-and-exposure-service",
    domain: "core",
    tier: 2,
    description: "Pre-trade checks + portfolio-level risk.",
  },
  {
    key: "execution-service",
    label: "execution-service",
    domain: "core",
    tier: 2,
    description: "CeFi/DeFi/Sports order routing + matching engine.",
  },
  {
    key: "strategy-service",
    label: "strategy-service",
    domain: "core",
    tier: 2,
    description: "Signal generation + strategy orchestration.",
  },
  {
    key: "features-onchain-service",
    label: "features-onchain-service",
    domain: "core",
    tier: 2,
    description: "On-chain feature calculation pipeline.",
  },
  {
    key: "features-market-service",
    label: "features-market-service",
    domain: "core",
    tier: 2,
    description: "Market-data feature calculation pipeline.",
  },
  {
    key: "features-sports-service",
    label: "features-sports-service",
    domain: "core",
    tier: 2,
    description: "Sports feature calculation pipeline.",
  },
  {
    key: "ml-training-service",
    label: "ml-training-service",
    domain: "core",
    tier: 2,
    description: "Model training + registry publish.",
  },
  {
    key: "ml-inference-service",
    label: "ml-inference-service",
    domain: "core",
    tier: 2,
    description: "Runtime model inference + score caching.",
  },
  {
    key: "fund-administration-service",
    label: "fund-administration-service",
    domain: "core",
    tier: 2,
    description: "IM Pooled sub/redemption rails + CapitalRouter.",
  },
  {
    key: "client-reporting-api",
    label: "client-reporting-api",
    domain: "core",
    tier: 1,
    description: "Client-facing reporting + entitlement gates.",
  },
  {
    key: "unified-trading-api",
    label: "unified-trading-api",
    domain: "core",
    tier: 1,
    description: "Front-door API gateway for all DART surfaces.",
  },
  {
    key: "user-management-api",
    label: "user-management-api",
    domain: "core",
    tier: 1,
    description: "User CRUD, entitlements, group management.",
  },
  {
    key: "orchestrator-agent",
    label: "orchestrator-agent",
    domain: "core",
    tier: 2,
    description: "Background agent — plan-health, codex-sync.",
  },
  {
    key: "semver-agent",
    label: "semver-agent (GHA)",
    domain: "core",
    tier: 3,
    description: "Auto-version bumps on merge to main.",
  },
  {
    key: "unified-trading-pm",
    label: "unified-trading-pm",
    domain: "core",
    tier: 0,
    description: "SSOT — plans, codex, scripts, cursor-configs.",
  },

  // ─── Sports Category ───────────────────────────────────────────────────────
  {
    key: "sports-feature-interface",
    label: "sports-feature-interface",
    domain: "sports",
    tier: 2,
    description: "Sports-domain feature accessor wrappers.",
  },
  {
    key: "sportsbook-forward-interface",
    label: "sportsbook-forward-interface (SFI)",
    domain: "sports",
    tier: 2,
    description: "Forward-poll adapter bank for 20+ sportsbooks.",
  },
  {
    key: "sports-aggregator-service",
    label: "sports-aggregator-service",
    domain: "sports",
    tier: 2,
    description: "Per-league fixture aggregation + book-level status.",
  },
  {
    key: "sports-settlement-service",
    label: "sports-settlement-service",
    domain: "sports",
    tier: 2,
    description: "Market resolution + fill settlement rails.",
  },
  {
    key: "sports-reference-data-service",
    label: "sports-reference-data-service",
    domain: "sports",
    tier: 2,
    description: "League, competitor, and market reference data.",
  },

  // ─── CeFi Category ─────────────────────────────────────────────────────────
  {
    key: "cefi-exchange-interface",
    label: "cefi-exchange-interface",
    domain: "cefi",
    tier: 2,
    description: "Binance / Coinbase / Kraken / Deribit adapters.",
  },
  {
    key: "cefi-market-data-ingest",
    label: "cefi-market-data-ingest",
    domain: "cefi",
    tier: 2,
    description: "CEX tick-level ingestion.",
  },
  {
    key: "cefi-balance-reconciler",
    label: "cefi-balance-reconciler",
    domain: "cefi",
    tier: 2,
    description: "CEX account + balance reconciliation.",
  },
  {
    key: "cefi-market-regime-service",
    label: "cefi-market-regime-service",
    domain: "cefi",
    tier: 2,
    description: "CEX regime classifier + feature feed.",
  },

  // ─── TradFi Category ───────────────────────────────────────────────────────
  {
    key: "tradfi-cme-interface",
    label: "tradfi-cme-interface",
    domain: "tradfi",
    tier: 2,
    description: "CME futures + index adapters (ES, NQ, etc.).",
  },
  {
    key: "tradfi-equities-interface",
    label: "tradfi-equities-interface",
    domain: "tradfi",
    tier: 2,
    description: "Equities / ETF adapters.",
  },
  {
    key: "tradfi-fx-interface",
    label: "tradfi-fx-interface",
    domain: "tradfi",
    tier: 2,
    description: "Spot + forward FX adapters.",
  },
  {
    key: "tradfi-ratesdata-service",
    label: "tradfi-ratesdata-service",
    domain: "tradfi",
    tier: 2,
    description: "Rates + yield curve ingest.",
  },
  {
    key: "tradfi-settlement-service",
    label: "tradfi-settlement-service",
    domain: "tradfi",
    tier: 2,
    description: "Custodian + prime-broker settlement.",
  },

  // ─── DeFi Category ─────────────────────────────────────────────────────────
  {
    key: "defi-chain-interface",
    label: "defi-chain-interface",
    domain: "defi",
    tier: 2,
    description: "Multi-chain RPC router (EVM + Solana).",
  },
  {
    key: "defi-uniswap-adapter",
    label: "defi-uniswap-adapter",
    domain: "defi",
    tier: 2,
    description: "Uniswap V3 swap + pool state.",
  },
  {
    key: "defi-aave-adapter",
    label: "defi-aave-adapter",
    domain: "defi",
    tier: 2,
    description: "Aave lending / flash-loan adapter.",
  },
  {
    key: "defi-hyperliquid-adapter",
    label: "defi-hyperliquid-adapter",
    domain: "defi",
    tier: 2,
    description: "Hyperliquid perpetuals + orderbook.",
  },
  {
    key: "defi-curve-adapter",
    label: "defi-curve-adapter",
    domain: "defi",
    tier: 2,
    description: "Curve stableswap pool adapter.",
  },
  {
    key: "defi-onchain-ingest",
    label: "defi-onchain-ingest",
    domain: "defi",
    tier: 2,
    description: "On-chain event backfill + forward poll.",
  },
  {
    key: "defi-wallet-reconciler",
    label: "defi-wallet-reconciler",
    domain: "defi",
    tier: 2,
    description: "Wallet / position reconciliation.",
  },
  {
    key: "defi-gas-oracle",
    label: "defi-gas-oracle",
    domain: "defi",
    tier: 2,
    description: "Per-chain gas price oracle.",
  },

  // ─── Prediction Category ───────────────────────────────────────────────────
  {
    key: "prediction-market-interface",
    label: "prediction-market-interface",
    domain: "prediction",
    tier: 2,
    description: "Polymarket / Kalshi adapters.",
  },
  {
    key: "prediction-aggregator-service",
    label: "prediction-aggregator-service",
    domain: "prediction",
    tier: 2,
    description: "Cross-venue prediction market aggregation.",
  },
  {
    key: "prediction-settlement-service",
    label: "prediction-settlement-service",
    domain: "prediction",
    tier: 2,
    description: "Prediction market resolution + payout.",
  },

  // ─── UI Surfaces ──────────────────────────────────────────────────────────
  {
    key: "unified-trading-system-ui",
    label: "unified-trading-system-ui",
    domain: "ui",
    tier: 0,
    description: "Platform UI — dashboard, lifecycle nav, DART.",
  },
  {
    key: "deployment-ui",
    label: "deployment-ui",
    domain: "ui",
    tier: 0,
    description: "Internal ops UI — data status, deploys.",
  },
  {
    key: "user-management-ui",
    label: "user-management-ui (archived)",
    domain: "ui",
    tier: 0,
    description: "Archived 2026-04-21 — folded into platform /admin.",
  },
  {
    key: "odum-user-mgmt-admin",
    label: "odum-user-mgmt-admin",
    domain: "ui",
    tier: 0,
    description: "Firebase admin UI shim.",
  },
  {
    key: "client-reporting-ui",
    label: "client-reporting-ui",
    domain: "ui",
    tier: 0,
    description: "Read-only client portal.",
  },
  {
    key: "investor-relations-ui",
    label: "investor-relations-ui",
    domain: "ui",
    tier: 0,
    description: "IR briefing + board materials.",
  },
  {
    key: "strategy-dashboard-ui",
    label: "strategy-dashboard-ui",
    domain: "ui",
    tier: 0,
    description: "Legacy strategy dashboard; folded into DART.",
  },
  {
    key: "research-sandbox-ui",
    label: "research-sandbox-ui",
    domain: "ui",
    tier: 0,
    description: "Notebook-style research surface.",
  },
  {
    key: "settlements-ui",
    label: "settlements-ui",
    domain: "ui",
    tier: 0,
    description: "Settlement operator surface.",
  },
  {
    key: "compliance-ui",
    label: "compliance-ui",
    domain: "ui",
    tier: 0,
    description: "Compliance + regulatory reporting.",
  },
  {
    key: "defi-console-ui",
    label: "defi-console-ui",
    domain: "ui",
    tier: 0,
    description: "DeFi connector + chain monitoring.",
  },
  {
    key: "ml-registry-ui",
    label: "ml-registry-ui",
    domain: "ui",
    tier: 0,
    description: "Model registry + promotion workflows.",
  },
  {
    key: "observability-ui",
    label: "observability-ui",
    domain: "ui",
    tier: 0,
    description: "Metrics + tracing dashboards.",
  },
] as const;
