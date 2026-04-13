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
    description:
      "Full system admin. Sees everything: platform, ops, deployments, user management.",
  },
  {
    id: "internal-trader",
    email: "trader@odum.internal",
    password: "demo",
    displayName: "Internal Trader",
    role: "internal",
    org: { id: "odum-internal", name: "Odum Internal" },
    entitlements: ["*"],
    description:
      "Internal trading desk. All platform features, no ops/admin pages.",
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
    ],
    description:
      "External client with full subscription. Sees own org data only.",
  },
  {
    id: "client-data-only",
    email: "analyst@betafund.com",
    password: "demo",
    displayName: "Data Analyst",
    role: "client",
    org: { id: "beta", name: "Beta Fund" },
    entitlements: ["data-basic"],
    description:
      "External client with basic data tier. 180 instruments, CEFI only.",
  },
  {
    id: "client-premium",
    email: "cio@vertex.com",
    password: "demo",
    displayName: "CIO",
    role: "client",
    org: { id: "vertex", name: "Vertex Partners" },
    entitlements: ["data-pro", "execution-full", "strategy-full"],
    description:
      "Premium execution client. Data + strategy + Smart Alpha execution, no ML.",
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
    ],
    description:
      "Investor / board member. Sees all investor relations presentations and demos.",
  },
  {
    id: "advisor",
    email: "advisor@odum-research.co.uk",
    password: "demo",
    displayName: "Strategic Advisor",
    role: "client",
    org: { id: "odum-ir", name: "Odum Investor Relations" },
    entitlements: [
      "investor-relations",
      "investor-board",
      "investor-plan",
    ],
    description:
      "Strategic advisor. Sees board presentation and plan deck only.",
  },
  {
    id: "prospect-im",
    email: "prospect-im@odum-research.co.uk",
    password: "demo",
    displayName: "Investment Prospect",
    role: "client",
    org: { id: "odum-ir", name: "Odum Investor Relations" },
    entitlements: [
      "investor-relations",
      "investor-im",
    ],
    description:
      "Investment management prospect. Sees investment management presentation and demo.",
  },
  {
    id: "prospect-platform",
    email: "prospect-platform@odum-research.co.uk",
    password: "demo",
    displayName: "Platform Prospect",
    role: "client",
    org: { id: "odum-ir", name: "Odum Investor Relations" },
    entitlements: [
      "investor-relations",
      "investor-platform",
      "data-pro",
      "execution-full",
      "reporting",
    ],
    description:
      "Platform prospect. Sees platform presentation, demo, and data/execution/reporting pages.",
  },
  {
    id: "prospect-regulatory",
    email: "prospect-regulatory@odum-research.co.uk",
    password: "demo",
    displayName: "Regulatory Prospect",
    role: "client",
    org: { id: "odum-ir", name: "Odum Investor Relations" },
    entitlements: [
      "investor-relations",
      "investor-regulatory",
      "reporting",
    ],
    description:
      "Regulatory umbrella prospect. Sees regulatory presentation, demo, and reporting pages.",
  },
  {
    id: "elysium-defi",
    email: "patrick@bankelysium.com",
    password: "demo",
    displayName: "Patrick",
    role: "client",
    org: { id: "elysium", name: "Elysium" },
    entitlements: [
      "data-pro",
      "execution-full",
      "defi-trading",
      "reporting",
    ],
    description:
      "DeFi client demo. DeFi trading tab + general terminal (overview, positions, orders, P&L, risk, alerts, book, accounts, instructions). Strategy families LOCKED. Sports/Predictions/Options LOCKED. Build/Data LOCKED. Strategies: AAVE_LENDING, BASIS_TRADE, STAKED_BASIS, RECURSIVE_STAKED_BASIS (demo only).",
  },
] as const;

export function getPersonaById(id: string): AuthPersona | undefined {
  return PERSONAS.find((p) => p.id === id);
}

export function getPersonaByEmail(email: string): AuthPersona | undefined {
  return PERSONAS.find((p) => p.email === email);
}
