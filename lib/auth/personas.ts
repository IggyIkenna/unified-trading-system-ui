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
    entitlements: ["investor-relations"],
    description:
      "Investor / board member. Sees investor relations presentations only — board deck, disaster recovery, security posture.",
  },
] as const;

export function getPersonaById(id: string): AuthPersona | undefined {
  return PERSONAS.find((p) => p.id === id);
}

export function getPersonaByEmail(email: string): AuthPersona | undefined {
  return PERSONAS.find((p) => p.email === email);
}
