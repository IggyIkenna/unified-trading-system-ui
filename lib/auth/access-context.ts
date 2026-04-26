/**
 * Access context — three-context model for the funnel.
 *
 * Funnel Coherence plan Workstream H. The same DART / Reports / Strategy
 * Catalogue component stack renders in different contexts depending on
 * where the prospect/client sits in the funnel. Components branch their
 * data source, available actions, and labels on this enum.
 *
 * Contexts:
 *   - public        — public marketing pages (no signin)
 *   - briefing      — gated briefings (access-code session)
 *   - strategy_review — magic-link-gated Strategy Review surface
 *   - demo_uat      — admin-issued demo session, mock data only
 *   - production    — full signed-in client, real data + entitlements
 *
 * Codex SSOT: codex/08-workflows/platform-walkthrough-and-demo-context.md
 */

export type AccessContext = "public" | "briefing" | "strategy_review" | "demo_uat" | "production";

export const ACCESS_CONTEXTS: readonly AccessContext[] = [
  "public",
  "briefing",
  "strategy_review",
  "demo_uat",
  "production",
] as const;

export function isDemoContext(ctx: AccessContext): boolean {
  return ctx === "demo_uat";
}

export function isProductionContext(ctx: AccessContext): boolean {
  return ctx === "production";
}

/**
 * Whether the current context permits mutating actions (place order, modify
 * mandate, upload credentials). Demo and pre-signin contexts return false;
 * production returns true.
 */
export function allowsMutatingActions(ctx: AccessContext): boolean {
  return ctx === "production";
}

/**
 * Whether the current context permits opening real production data sources.
 * Demo + UAT use mock fixtures; production uses live APIs.
 */
export function allowsRealData(ctx: AccessContext): boolean {
  return ctx === "production";
}

/**
 * Resolve the active access context from session signals.
 *
 * Priority:
 *   1. Demo-session token in localStorage (`odum-demo-session-active`) → demo_uat.
 *   2. Strategy Review token resolved server-side → strategy_review (caller passes).
 *   3. Briefings session active flag → briefing.
 *   4. Authenticated user with production entitlements → production.
 *   5. Fallback → public.
 *
 * The caller is expected to pass already-known signals; this is just the
 * arbitration order.
 */
export function resolveAccessContext(signals: {
  hasProductionAuth?: boolean;
  hasDemoSession?: boolean;
  hasStrategyReviewToken?: boolean;
  hasBriefingSession?: boolean;
}): AccessContext {
  if (signals.hasDemoSession) return "demo_uat";
  if (signals.hasProductionAuth) return "production";
  if (signals.hasStrategyReviewToken) return "strategy_review";
  if (signals.hasBriefingSession) return "briefing";
  return "public";
}

/**
 * Client-side check: does this browser session carry a demo entitlement?
 * Used by client components to switch into demo/UAT mode without a
 * round-trip to the server.
 */
export function clientHasDemoSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem("odum-demo-session-active") === "1";
  } catch {
    return false;
  }
}

export function setDemoSessionActive(active: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (active) {
      window.localStorage.setItem("odum-demo-session-active", "1");
    } else {
      window.localStorage.removeItem("odum-demo-session-active");
    }
  } catch {
    // ignore
  }
}
