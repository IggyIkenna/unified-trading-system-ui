import type { Page } from "@playwright/test";

/**
 * Seed a demo persona directly into localStorage so Playwright tests can skip
 * the login form. Matches DemoAuthProvider storage shape in
 * lib/auth/demo-provider.ts (STORAGE_KEY=portal_user, TOKEN_KEY=portal_token).
 *
 * Personas defined in lib/auth/personas.ts. This helper keeps the list in sync
 * for test-only use; if personas.ts changes, update here too.
 *
 * Codex SSOT: unified-trading-pm/codex/14-playbooks/authentication/README.md
 */

type DemoUser = {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly role: "admin" | "internal" | "client";
  readonly org: { readonly id: string; readonly name: string };
  readonly entitlements: readonly (string | { readonly domain: string; readonly tier: string })[];
};

const PERSONAS: Readonly<Record<string, DemoUser>> = {
  admin: {
    id: "admin",
    email: "admin@odum.internal",
    displayName: "Admin",
    role: "admin",
    org: { id: "odum-internal", name: "Odum Internal" },
    entitlements: ["*"],
  },
  "internal-trader": {
    id: "internal-trader",
    email: "trader@odum.internal",
    displayName: "Internal Trader",
    role: "internal",
    org: { id: "odum-internal", name: "Odum Internal" },
    entitlements: ["*"],
  },
  "client-full": {
    id: "client-full",
    email: "pm@alphacapital.com",
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
  },
  "client-data-only": {
    id: "client-data-only",
    email: "analyst@betafund.com",
    displayName: "Data Analyst",
    role: "client",
    org: { id: "beta", name: "Beta Fund" },
    entitlements: ["data-basic"],
  },
  "prospect-im": {
    id: "prospect-im",
    email: "prospect-im@odum-research.co.uk",
    displayName: "Investment Prospect",
    role: "client",
    org: { id: "demo-im", name: "Demo — IM Prospect" },
    entitlements: ["reporting", "investor-relations"],
  },
  // G3.6 expansion — 2 additional personas covered by the restriction-profile
  // registry (prospect-dart, prospect-regulatory) + 1 admin-proxy
  // (internal-trader). Entitlements mirror `lib/auth/personas.ts` exactly.
  "prospect-dart": {
    id: "prospect-dart",
    email: "sarah.quant@examplehedge.com",
    displayName: "Sarah Quant",
    role: "client",
    org: { id: "example-hedge", name: "Example Hedge" },
    entitlements: ["data-pro", "execution-full", "ml-full", "strategy-full", "reporting"],
  },
  "prospect-regulatory": {
    id: "prospect-regulatory",
    email: "prospect-regulatory@odum-research.co.uk",
    displayName: "Regulatory Prospect",
    role: "client",
    org: { id: "odum-ir", name: "Odum Investor Relations" },
    entitlements: ["investor-relations", "investor-regulatory", "reporting"],
  },
  "internal-trader": {
    id: "internal-trader",
    email: "trader@odum.internal",
    displayName: "Internal Trader",
    role: "internal",
    org: { id: "odum-internal", name: "Odum Internal" },
    entitlements: ["*"],
  },
};

export async function seedPersona(page: Page, personaId: keyof typeof PERSONAS): Promise<void> {
  const user = PERSONAS[personaId];
  if (!user) throw new Error(`Unknown persona: ${personaId}`);
  const token = `demo-token-${personaId}`;
  await page.addInitScript(
    ({ userJson, tokenValue }) => {
      localStorage.setItem("portal_user", userJson);
      localStorage.setItem("portal_token", tokenValue);
    },
    { userJson: JSON.stringify(user), tokenValue: token },
  );
}

export async function clearPersona(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.removeItem("portal_user");
    localStorage.removeItem("portal_token");
  });
}
