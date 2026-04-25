import type { AuthPersona } from "@/lib/config/auth";

/**
 * Demo personas covering all access tiers and commercial paths.
 *
 * SECURITY NOTE: Passwords are plaintext because this is a demo/mock-only
 * fixture. These credentials are intentionally visible in the client bundle
 * to enable instant demo login. In production, auth would use OAuth/OIDC
 * with server-side session management — never client-side password storage.
 *
 * External-facing advisor accounts use @odum-research.co.uk to distinguish
 * them from internal @odum.internal accounts. AUTH_PROVIDER=demo on prod
 * validates them client-side against PERSONAS — no separate UAT redirect needed.
 *
 * Internal personas (@odum.internal, @alphacapital.com, etc.) are for
 * in-house demo use and are not shared externally.
 */
export const PERSONAS: readonly AuthPersona[] = [
  // ── Internal / platform team ─────────────────────────────────────────
  {
    id: "admin",
    email: "admin@odum.internal",
    password: "demo",
    displayName: "Admin",
    role: "admin",
    org: { id: "odum-internal", name: "Odum Internal" },
    entitlements: ["*"],
    description: "Full system admin. Sees everything: platform, ops, deployments, user management.",
  },
  {
    id: "internal-trader",
    email: "trader@odum.internal",
    password: "demo",
    displayName: "Internal Trader",
    role: "internal",
    org: { id: "odum-internal", name: "Odum Internal" },
    entitlements: ["*"],
    description: "Internal trading desk. All platform features, no ops/admin pages.",
  },
  {
    id: "im-desk-operator",
    email: "desk@odum.internal",
    password: "demo",
    displayName: "IM Desk Operator",
    role: "internal",
    org: { id: "odum-internal", name: "Odum Internal" },
    entitlements: ["*"],
    description:
      "IM desk operator — locks/unlocks strategies via the catalogue admin toggle + sees reporting for cross-client observation.",
  },

  // ── External-facing advisor / investor accounts (@odum-research.co.uk) ─
  // These are shared with advisors and prospects via the IR email.
  // Auth happens on prod via AUTH_PROVIDER=demo — validated client-side against PERSONAS.
  {
    id: "admin-odum",
    email: "admin@odum-research.co.uk",
    password: "OdumIR2026!",
    displayName: "Admin",
    role: "admin",
    org: { id: "odum-ir", name: "Odum Research" },
    entitlements: ["*"],
    description: "Full-access admin account for board and internal review of the demo environment.",
  },
  {
    id: "investor",
    email: "investor@odum-research.co.uk",
    password: "OdumIR2026!",
    displayName: "Investor",
    role: "client",
    org: { id: "odum-ir", name: "Odum Investor Relations" },
    entitlements: [
      "investor-relations",
      "investor-board",
      "investor-plan",
      "investor-platform",
      "investor-im",
      "investor-regulatory",
      "investor-archive",
      // Platform entitlements so "See It Live" demo links in presentations are accessible
      "data-pro",
      "execution-full",
      "ml-full",
      "strategy-full",
      "reporting",
    ],
    description: "Investor / board member. Sees all investor relations presentations and demos.",
  },
  {
    id: "advisor",
    email: "advisor@odum-research.co.uk",
    password: "OdumIR2026!",
    displayName: "Strategic Advisor",
    role: "client",
    org: { id: "odum-ir", name: "Odum Investor Relations" },
    entitlements: [
      "investor-relations",
      "investor-board",
      "investor-plan",
      // Platform entitlements so "See It Live" demo links in presentations are accessible
      "data-pro",
      "execution-full",
      "ml-full",
      "strategy-full",
      "reporting",
    ],
    description: "Strategic advisor. Sees board presentation and plan deck only.",
  },
  {
    id: "prospect-im",
    email: "prospect-im@odum-research.com",
    password: "demo",
    displayName: "Investment Prospect",
    role: "client",
    org: { id: "odum-ir", name: "Odum Investor Relations" },
    entitlements: ["investor-relations", "investor-im"],
    description: "Investment management prospect. Sees investment management presentation and demo.",
  },
  {
    id: "prospect-dart-full",
    email: "prospect-dart-full@odum-research.com",
    password: "demo",
    displayName: "DART Full Pipeline Prospect",
    role: "client",
    org: { id: "odum-ir", name: "Odum Investor Relations" },
    entitlements: [
      "investor-relations",
      "investor-platform",
      "data-pro",
      "execution-full",
      "ml-full",
      "strategy-full",
      "reporting",
    ],
    description:
      "Emerging manager prospect for DART Full Pipeline — research, build, promote, run, report. Full platform surface under Odum's regulated wrapper.",
  },
  {
    id: "prospect-dart-signals-in",
    email: "prospect-dart-signals-in@odum-research.com",
    password: "demo",
    displayName: "DART Signals-In Prospect",
    role: "client",
    org: { id: "odum-ir", name: "Odum Investor Relations" },
    entitlements: ["investor-relations", "investor-platform", "data-pro", "execution-full", "reporting"],
    description:
      "Professional trading firm prospect for DART Signals-In — client keeps strategy IP, Odum provides execution and infrastructure. Research/promote hidden.",
  },
  {
    id: "prospect-odum-signals",
    email: "prospect-odum-signals@odum-research.com",
    password: "demo",
    displayName: "Odum Signals Prospect",
    role: "client",
    org: { id: "odum-ir", name: "Odum Investor Relations" },
    entitlements: ["investor-relations", "execution-full", "reporting"],
    description:
      "Counterparty / allocator prospect for Odum Signals — receives outbound signal emissions, executes elsewhere. Reports surface only, no DART.",
  },
  {
    id: "prospect-regulatory",
    email: "prospect-regulatory@odum-research.com",
    password: "demo",
    displayName: "Regulatory Prospect",
    role: "client",
    org: { id: "odum-ir", name: "Odum Investor Relations" },
    entitlements: ["investor-relations", "investor-regulatory", "reporting"],
    description: "Regulatory umbrella prospect. Sees regulatory presentation, demo, and reporting pages.",
  },
  {
    id: "demo-signals-client",
    email: "demo-signals@odum-research.co.uk",
    password: "OdumIR2026!",
    displayName: "Demo Signals Client",
    role: "client",
    org: { id: "odum-demo-signals", name: "Demo Signals Client Co" },
    entitlements: [
      "data-pro",
      "execution-full",
      "reporting",
      { domain: "trading-common", tier: "basic" },
    ],
    description:
      "Clean Signals-In product showcase. DART tile + Reports tile visible; Research / Promote / Strategy Catalogue locked. Use this when demoing the Signals-In product end-to-end without prospect-specific context.",
  },
  {
    id: "demo-im-reports-only",
    email: "demo-im@odum-research.co.uk",
    password: "OdumIR2026!",
    displayName: "Demo IM Client",
    role: "client",
    org: { id: "odum-demo-im", name: "Demo IM Client Fund" },
    entitlements: ["reporting"],
    description:
      "Reports-only IM client. No DART tile, no investor-relations — just the Reports surface. Use this when demoing the IM allocator's view: monthly P&L, attribution, settlement reconciliation. Distinct from client-im-pooled / client-im-sma which also have investor-relations.",
  },

  // ── External client demos ─────────────────────────────────────────────
  {
    id: "client-full",
    email: "pm@alphacapital.com",
    password: "demo",
    displayName: "Portfolio Manager",
    role: "client",
    org: { id: "acme", name: "Alpha Capital" },
    entitlements: [
      "data-pro",
      "execution-full",
      "ml-full",
      "strategy-full",
      "reporting",
      { domain: "trading-common", tier: "premium" },
      { domain: "trading-defi", tier: "premium" },
      { domain: "trading-sports", tier: "premium" },
      { domain: "trading-options", tier: "premium" },
      { domain: "trading-predictions", tier: "premium" },
    ],
    description: "External client with full subscription. Sees own org data only.",
  },
  {
    id: "client-data-only",
    email: "analyst@betafund.com",
    password: "demo",
    displayName: "Data Analyst",
    role: "client",
    org: { id: "beta", name: "Beta Fund" },
    entitlements: ["data-basic"],
    description: "External client with basic data tier. 180 instruments, CEFI only.",
  },
  {
    id: "client-premium",
    email: "cio@vertex.com",
    password: "demo",
    displayName: "CIO",
    role: "client",
    org: { id: "vertex", name: "Vertex Partners" },
    entitlements: [
      "data-pro",
      "execution-full",
      "strategy-full",
      { domain: "trading-common", tier: "basic" },
      { domain: "trading-defi", tier: "basic" },
      { domain: "trading-sports", tier: "basic" },
      { domain: "trading-options", tier: "basic" },
      { domain: "trading-predictions", tier: "basic" },
    ],
    description: "Premium execution client. Data + strategy + Smart Alpha execution, no ML.",
  },
  {
    id: "elysium-defi",
    email: "patrick@bankelysium.com",
    password: "demo",
    displayName: "Patrick",
    role: "client",
    org: { id: "elysium", name: "Elysium" },
    entitlements: ["data-pro", "execution-full", { domain: "trading-defi", tier: "basic" }, "reporting"],
    description:
      "DeFi client demo (base tier). Execution + reporting only. Strategy catalogue locked — use elysium-defi-full toggle to preview upgrade.",
    // Patrick's base tier — only the two foundation DeFi carry strategies are
    // routed (no strategy-full, so resolver gives reports-only). Recursive
    // staked is in the upgrade-preview persona below, locked here.
    assigned_strategies: [
      "CARRY_BASIS_PERP@defi-perp-hyperliquid@hyperliquid",
      "CARRY_STAKED_BASIS@defi-staking-lido@ethereum",
    ],
  },
  {
    id: "elysium-defi-full",
    email: "patrick@bankelysium.com",
    password: "demo",
    displayName: "Patrick",
    role: "client",
    org: { id: "elysium", name: "Elysium" },
    entitlements: ["data-pro", "execution-full", "strategy-full", { domain: "trading-defi", tier: "basic" }, "reporting"],
    description:
      "DeFi client demo (upgrade preview). Adds strategy-full — shows CARRY_BASIS_PERP + CARRY_STAKED_BASIS catalogue, recursive staked locked as next tier.",
    // Upgrade tier — adds CARRY_RECURSIVE_STAKED + multi-protocol yield
    // rotation. With strategy-full the resolver returns "terminal" for these.
    assigned_strategies: [
      "CARRY_BASIS_PERP@defi-perp-hyperliquid@hyperliquid",
      "CARRY_STAKED_BASIS@defi-staking-lido@ethereum",
      "CARRY_RECURSIVE_STAKED@defi-staking-lido@ethereum",
      "YIELD_ROTATION_LENDING@defi-lending-aave_v3@ethereum",
      "YIELD_ROTATION_LENDING@defi-lending-aave_v3@arbitrum",
    ],
  },
  {
    id: "prospect-dart",
    email: "sarah.quant@examplehedge.com",
    password: "demo",
    displayName: "Sarah Quant",
    role: "client",
    org: { id: "example-hedge", name: "Example Hedge" },
    entitlements: ["data-pro", "execution-full", "ml-full", "strategy-full", "reporting"],
    description:
      "Warm DART prospect. CeFi-focused ML-directional strategy, pooled-fund evaluation. Promote padlocked as upsell tease.",
  },
  {
    id: "client-regulatory",
    email: "fm@emergingmgr.com",
    password: "demo",
    displayName: "Fund Manager",
    role: "client",
    org: { id: "emerging-mgr", name: "Emerging Manager Ltd" },
    entitlements: ["reporting", "data-pro"],
    description:
      "Active Regulatory Umbrella client operating under Odum's FCA permissions. Reporting + compliance overlay unlocked.",
  },
  {
    id: "client-im-pooled",
    email: "pm@lpfund.com",
    password: "demo",
    displayName: "Pooled-Fund LP",
    role: "client",
    org: { id: "lp-fund", name: "LP Fund" },
    entitlements: ["reporting", "investor-relations"],
    description: "IM client on the Pooled-Fund share class. Sees reports + investor-relations only.",
  },
  {
    id: "client-im-sma",
    email: "cio@smaclient.com",
    password: "demo",
    displayName: "SMA CIO",
    role: "client",
    org: { id: "sma-client", name: "SMA Client Inc" },
    entitlements: ["reporting", "investor-relations", "data-pro"],
    description: "IM client on an SMA (Separately Managed Account).",
  },
  {
    id: "prospect-signals-only",
    email: "ops@defihf.com",
    password: "demo",
    displayName: "Signals-Only Ops Lead",
    role: "client",
    org: { id: "defi-hf", name: "DeFi Hedge Fund" },
    entitlements: ["execution-full", "data-pro", "reporting"],
    description: "Signals-only DART prospect. Client keeps strategy IP; Odum runs execution + reporting.",
  },
  {
    id: "prospect-im-under-regulatory",
    email: "cio@hybridfund.example",
    password: "demo",
    displayName: "IM-under-Regulatory CIO",
    role: "client",
    org: { id: "hybrid-fund", name: "Hybrid Fund" },
    entitlements: ["reporting", "investor-relations", "data-pro"],
    description: "Hybrid case — IM client operating under Odum's Regulatory Umbrella.",
  },
  {
    id: "prospect-platform",
    email: "platform-prospect@odum-research.com",
    password: "demo",
    displayName: "Platform Prospect",
    role: "client",
    org: { id: "example-platform", name: "Example Platform Co" },
    entitlements: ["data-pro", "execution-full", "strategy-full", "reporting"],
    description:
      "Generic DART / platform prospect. Full DART access + reporting; no Manage stage.",
  },
  {
    id: "prospect-perp-funding",
    email: "ops@desmond-capital.example",
    password: "demo",
    displayName: "Desmond Ops",
    role: "client",
    org: { id: "desmond-capital", name: "Desmond Capital" },
    entitlements: [
      "reporting",
      "investor-regulatory",
      "data-pro",
      "execution-full",
      { domain: "trading-defi", tier: "basic" },
      { domain: "trading-common", tier: "basic" },
    ],
    description:
      "Reg Umbrella + DART Signals-In prospect running cross-exchange perp-funding arbitrage (CeFi + DeFi).",
  },

  // ── Desmond H-W — real-email staging demo (2026-04-24) ───────────────────
  // Two personas sharing the same email: getPersonaByEmail() returns the first
  // match (dart-full) on login. The DemoPlanToggle switches tiers via
  // getPersonaById("desmond-signals-in") directly. Pre-seeded questionnaire:
  // CeFi+DeFi, perp, carry+arb+stat_arb, neutral, low risk, low leverage.
  {
    id: "desmond-dart-full",
    email: "desmondhw@gmail.com",
    password: "odum-demo-2026",
    displayName: "Desmond H-W",
    role: "client",
    org: { id: "desmond-capital", name: "Desmond Capital" },
    entitlements: [
      "investor-relations",
      "investor-platform",
      "data-pro",
      "execution-full",
      "ml-full",
      "strategy-full",
      "reporting",
      // TradingEntitlement tiles — required for the trading umbrella shell.
      // Desmond runs cross-exchange perp-funding arb (CeFi + DeFi).
      { domain: "trading-common", tier: "basic" },
      { domain: "trading-defi", tier: "basic" },
    ],
    description:
      "Desmond (DART Full) — funding rate arb, stable yield, market-neutral, CeFi+DeFi, perp-only. Full Research/Promote access.",
    // Real catalogue slot labels routed to Desmond Capital — sourced from
    // strategy_instruments.json. Funding-rate carry on majors, structural
    // perp-funding arb, stat-arb across CeFi venues, ML-directional on perps.
    assigned_strategies: [
      "CARRY_BASIS_PERP@cefi-perp-binance",
      "CARRY_BASIS_PERP@cefi-perp-okx",
      "CARRY_BASIS_PERP@cefi-perp-bybit",
      "CARRY_BASIS_PERP@cefi-perp-hyperliquid",
      "ARBITRAGE_PRICE_DISPERSION@cefi-perp-binance",
      "ARBITRAGE_PRICE_DISPERSION@cefi-perp-okx",
      "ARBITRAGE_PRICE_DISPERSION@cefi-perp-bybit",
      "STAT_ARB_CROSS_SECTIONAL@cefi-spot-binance",
      "STAT_ARB_CROSS_SECTIONAL@cefi-spot-okx",
      "ML_DIRECTIONAL_CONTINUOUS@cefi-perp-binance",
      "ML_DIRECTIONAL_CONTINUOUS@cefi-perp-bybit",
    ],
  },
  {
    id: "desmond-signals-in",
    email: "desmondhw@gmail.com",
    password: "odum-demo-2026",
    displayName: "Desmond H-W",
    role: "client",
    org: { id: "desmond-capital", name: "Desmond Capital" },
    entitlements: [
      "investor-relations",
      "investor-platform",
      "data-pro",
      "execution-full",
      "reporting",
      // no strategy-full / ml-full → Research + Promote sub-routes are gated
      { domain: "trading-common", tier: "basic" },
      { domain: "trading-defi", tier: "basic" },
    ],
    description:
      "Desmond (Signals-In) — same universe as DART Full; Research/Promote locked. Toggle from desmond-dart-full to compare tiers.",
    // Same catalogue universe as DART-Full but lacks `strategy-full` — the
    // resolver returns "reports-only" for assigned slots since Research /
    // Promote are gated.
    assigned_strategies: [
      "CARRY_BASIS_PERP@cefi-perp-binance",
      "CARRY_BASIS_PERP@cefi-perp-okx",
      "CARRY_BASIS_PERP@cefi-perp-bybit",
      "CARRY_BASIS_PERP@cefi-perp-hyperliquid",
      "ARBITRAGE_PRICE_DISPERSION@cefi-perp-binance",
      "ARBITRAGE_PRICE_DISPERSION@cefi-perp-okx",
      "ARBITRAGE_PRICE_DISPERSION@cefi-perp-bybit",
      "STAT_ARB_CROSS_SECTIONAL@cefi-spot-binance",
      "STAT_ARB_CROSS_SECTIONAL@cefi-spot-okx",
      "ML_DIRECTIONAL_CONTINUOUS@cefi-perp-binance",
      "ML_DIRECTIONAL_CONTINUOUS@cefi-perp-bybit",
    ],
  },
] as const;

export function getPersonaById(id: string): AuthPersona | undefined {
  return PERSONAS.find((p) => p.id === id);
}

export function getPersonaByEmail(email: string): AuthPersona | undefined {
  return PERSONAS.find((p) => p.email === email);
}

/**
 * Canonical set of demo-persona email addresses (lowercased). Consumed by the
 * production login page to redirect known demo prospects to UAT before they
 * try to authenticate against the production Firebase pool. Adding a new demo
 * persona here automatically enrolls them in the redirect.
 */
export const DEMO_PERSONA_EMAILS: ReadonlySet<string> = new Set(
  PERSONAS.map((p) => p.email.toLowerCase()),
);

export function isDemoPersonaEmail(email: string): boolean {
  return DEMO_PERSONA_EMAILS.has(email.trim().toLowerCase());
}
