import type { AuthPersona } from "@/lib/config/auth";

/**
 * 5 demo personas covering all access tiers.
 *
 * SECURITY NOTE: Passwords are plaintext because this is a demo/mock-only
 * fixture. These credentials are intentionally visible in the client bundle
 * to enable instant demo login. In production, auth would use OAuth/OIDC
 * with server-side session management — never client-side password storage.
 *
 * - admin: sees everything including ops/deployment/user-management
 * - internal-trader: internal desk, all entitlements
 * - client-full: external client with broad subscription
 * - client-data-only: external client with minimal data-only tier
 */
export const PERSONAS: readonly AuthPersona[] = [
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
    id: "investor",
    email: "investor@odum-research.co.uk",
    password: "demo",
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
    ],
    description: "Investor / board member. Sees all investor relations presentations and demos.",
  },
  {
    id: "advisor",
    email: "advisor@odum-research.co.uk",
    password: "demo",
    displayName: "Strategic Advisor",
    role: "client",
    org: { id: "odum-ir", name: "Odum Investor Relations" },
    entitlements: ["investor-relations", "investor-board", "investor-plan"],
    description: "Strategic advisor. Sees board presentation and plan deck only.",
  },
  {
    id: "prospect-im",
    email: "prospect-im@odum-research.co.uk",
    password: "demo",
    displayName: "Investment Prospect",
    role: "client",
    org: { id: "odum-ir", name: "Odum Investor Relations" },
    entitlements: ["investor-relations", "investor-im"],
    description: "Investment management prospect. Sees investment management presentation and demo.",
  },
  {
    id: "prospect-platform",
    email: "prospect-platform@odum-research.co.uk",
    password: "demo",
    displayName: "Platform Prospect",
    role: "client",
    org: { id: "odum-ir", name: "Odum Investor Relations" },
    entitlements: ["investor-relations", "investor-platform", "data-pro", "execution-full", "reporting"],
    description: "Platform prospect. Sees platform presentation, demo, and data/execution/reporting pages.",
  },
  {
    id: "prospect-regulatory",
    email: "prospect-regulatory@odum-research.co.uk",
    password: "demo",
    displayName: "Regulatory Prospect",
    role: "client",
    org: { id: "odum-ir", name: "Odum Investor Relations" },
    entitlements: ["investor-relations", "investor-regulatory", "reporting"],
    description: "Regulatory umbrella prospect. Sees regulatory presentation, demo, and reporting pages.",
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
      "DeFi client demo. DeFi trading tab + general terminal (overview, positions, orders, P&L, risk, alerts, book, accounts, instructions). Strategy families LOCKED. Sports/Predictions/Options LOCKED. Build/Data LOCKED. Strategies: AAVE_LENDING, BASIS_TRADE, STAKED_BASIS, RECURSIVE_STAKED_BASIS (demo only).",
  },
  // -------------------------------------------------------------------
  // G1.4 Wave F expansion — 6 new personas covering axis combinations
  // (service_family × maturity × strategy_style × fund_structure) that
  // weren't previously represented. Every persona's id matches a YAML
  // profile in `unified-trading-pm/codex/14-playbooks/demo-ops/profiles/`
  // (existing file reused when the audience fits, new file added
  // otherwise). Entitlements validated against rule 12 service-family
  // scope (rule_id 12 in `codex/14-playbooks/_ssot-rules/`).
  // -------------------------------------------------------------------
  {
    id: "prospect-dart",
    email: "sarah.quant@examplehedge.com",
    password: "demo",
    displayName: "Sarah Quant",
    role: "client",
    org: { id: "example-hedge", name: "Example Hedge" },
    entitlements: ["data-pro", "execution-full", "ml-full", "strategy-full", "reporting"],
    description:
      "Warm DART prospect. CeFi-focused ML-directional strategy, pooled-fund evaluation. Sees data/research/trading/observe/reports unlocked; promote padlocked as an upsell tease. Maps to G1.7 prospect-dart.yaml.",
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
      "Active Regulatory Umbrella client operating under Odum's FCA permissions. Reporting + compliance overlay unlocked; research/promote hidden (client runs own strategy stack). Maps to G1.7 prospect-regulatory.yaml (reused — same scope).",
  },
  {
    id: "client-im-pooled",
    email: "pm@lpfund.com",
    password: "demo",
    displayName: "Pooled-Fund LP",
    role: "client",
    org: { id: "lp-fund", name: "LP Fund" },
    entitlements: ["reporting", "investor-relations"],
    description:
      "IM client on the Pooled-Fund share class. Sees reports + investor-relations; all DART operational tiles hidden (Odum runs strategies, client sees reporting only). Maps to G1.7 prospect-im.yaml (reused — same scope).",
  },
  {
    id: "client-im-sma",
    email: "cio@smaclient.com",
    password: "demo",
    displayName: "SMA CIO",
    role: "client",
    org: { id: "sma-client", name: "SMA Client Inc" },
    entitlements: ["reporting", "investor-relations", "data-pro"],
    description:
      "IM client on an SMA (Separately Managed Account). Same tile surface as Pooled-Fund LP — differs only in fund_structure + legal wrapper. Maps to G1.7 prospect-im.yaml.",
  },
  {
    id: "prospect-signals-only",
    email: "ops@defihf.com",
    password: "demo",
    displayName: "Signals-Only Ops Lead",
    role: "client",
    org: { id: "defi-hf", name: "DeFi Hedge Fund" },
    entitlements: ["execution-full", "data-pro", "reporting"],
    description:
      "Signals-only DART prospect. Client keeps strategy IP upstream; Odum runs execution + reporting. Sees trading/observe/reports; research/promote hidden (client doesn't buy into block 6). Maps to G1.7 prospect-dart.yaml with tighter entitlements.",
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
      "IM desk operator — locks/unlocks strategies via the catalogue admin toggle + sees reporting for cross-client observation. Matches rule 12 IM_desk service family. Maps to G1.7 admin.yaml (nearest profile; IM_desk profile YAML is a G2.x follow-up).",
  },
  // -------------------------------------------------------------------
  // Phase 11 additions — 5-path coverage completion (plan todo
  // p10-add-missing-personas). Fills the counterparty Signals-Out case
  // and the IM-under-Regulatory hybrid case that weren't previously
  // represented in the 19-persona set.
  // -------------------------------------------------------------------
  {
    id: "prospect-odum-signals",
    email: "counterparty@odum-signals.example",
    password: "demo",
    displayName: "Odum Signals Counterparty",
    role: "client",
    org: { id: "odum-signals-cp", name: "Odum Signals Counterparty" },
    entitlements: ["execution-full", "reporting"],
    description:
      "Counterparty receiving Odum's outbound signal-leasing emissions (Signals-Out direction). Sees Reports only — no DART operational surface, no strategy-catalogue. Complements prospect-signals-only (Signals-In).",
  },
  {
    id: "prospect-im-under-regulatory",
    email: "cio@hybridfund.example",
    password: "demo",
    displayName: "IM-under-Regulatory CIO",
    role: "client",
    org: { id: "hybrid-fund", name: "Hybrid Fund" },
    entitlements: ["reporting", "investor-relations", "data-pro"],
    description:
      "Hybrid case — IM client operating under Odum's Regulatory Umbrella. Same Reports surface as other IM clients, plus Manage stage visibility for regulatory-reporting touch points.",
  },
  // -------------------------------------------------------------------
  // 2026-04-23 — Desmond-shape demo persona: Regulatory Umbrella + DART
  // Signals-In for cross-exchange perp-funding arbitrage. Models the real
  // first live umbrella+DART client. Entitlements mirror elysium-defi's
  // shape — reporting + data + execution, scoped by strategy archetype
  // so the client sees only CeFi+DeFi perp basis / price-dispersion arb.
  // -------------------------------------------------------------------
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
      "Reg Umbrella + DART Signals-In prospect running cross-exchange perp-funding arbitrage (CeFi + DeFi). Reports unlocked (regulatory reporting). DART surface limited to trading + observe tabs, with strategy scope restricted to CARRY_BASIS_PERP + ARBITRAGE_PRICE_DISPERSION archetypes. Research / Promote hidden — client keeps signal generation upstream. Questionnaire path: service_family=combo or RegUmbrella, instrument_types includes perp, strategy_style includes arbitrage, categories includes CeFi+DeFi.",
  },
] as const;

export function getPersonaById(id: string): AuthPersona | undefined {
  return PERSONAS.find((p) => p.id === id);
}

export function getPersonaByEmail(email: string): AuthPersona | undefined {
  return PERSONAS.find((p) => p.email === email);
}
