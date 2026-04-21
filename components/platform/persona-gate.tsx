"use client";

/**
 * PersonaGate — Phase 4 persona cascade.
 *
 * When a logged-in, non-admin, non-internal user lands on any `/services/*`
 * route without a resolved persona in `localStorage['odum-persona/v1']`, we
 * redirect them to `/questionnaire`. The questionnaire submit handler calls
 * `persistResolvedPersona()`, after which the downstream availability-store +
 * audience helpers can filter the catalogue to that persona's slice.
 *
 * - Admin + internal users are exempt (they always see the full catalogue).
 * - Counterparty users (`userType === "counterparty"`) bypass — they have a
 *   separate dashboard flow.
 * - Users whose persona already exists in `personas.ts` (e.g. seeded via the
 *   dev debug footer persona switcher) are treated as having a valid persona
 *   even without the localStorage entry — avoids forcing demo personas
 *   through the questionnaire.
 */

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/hooks/use-auth";
import { readResolvedPersona } from "@/lib/questionnaire/resolve-persona";
import { getPersonaById } from "@/lib/auth/personas";

const GATED_PREFIX = "/services";
const QUESTIONNAIRE_ROUTE = "/questionnaire";

export function PersonaGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (user.role === "admin" || user.role === "internal") return;
    if (user.userType === "counterparty") return;
    if (!pathname?.startsWith(GATED_PREFIX)) return;

    // Persona set via questionnaire -> localStorage or explicit seeded demo
    // persona id.
    const resolved = readResolvedPersona();
    if (resolved !== null) return;

    // If the auth user's id matches a known seeded persona (demo / dev
    // persona-switcher path), accept that as persona-provided and skip the
    // questionnaire redirect.
    if (user.id && getPersonaById(user.id) !== undefined) return;

    router.push(QUESTIONNAIRE_ROUTE);
  }, [loading, user, pathname, router]);

  return <>{children}</>;
}
