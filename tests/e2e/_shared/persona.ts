import type { Page } from "@playwright/test";

/**
 * Persona table — maps a role label to the localStorage fixture the portal shell
 * reads on boot. Keep this the single source of truth so strategy specs don't
 * each hardcode their own id/email/token triple.
 */
export const PERSONAS = {
  "internal-trader": {
    id: "internal-trader",
    email: "trader@odum.internal",
    token: "demo-token-internal-trader",
  },
  admin: {
    id: "odum-admin",
    email: "admin@odum.internal",
    token: "demo-token-admin",
  },
} as const;

export type PersonaKey = keyof typeof PERSONAS;

/**
 * Inject the given persona into localStorage before any app JS runs. This is the
 * equivalent of a login flow for mock-mode tests — the portal shell reads these
 * keys synchronously on first render and treats the user as authenticated.
 *
 * Skipping the real login UI is intentional for strategy specs (the login flow
 * has its own dedicated spec in auth-flow.spec.ts).
 */
export async function seedPersona(page: Page, persona: PersonaKey): Promise<void> {
  const entry = PERSONAS[persona];
  await page.addInitScript((p) => {
    localStorage.setItem("portal_user", JSON.stringify({ id: p.id, email: p.email }));
    localStorage.setItem("portal_token", p.token);
  }, entry);
}
