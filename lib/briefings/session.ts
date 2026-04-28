/** localStorage key for lighter-gate (briefings + docs) — distinct from staging gate and Firebase session. */
import * as React from "react";

export const BRIEFING_SESSION_STORAGE_KEY = "odum-briefing-session";

const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((l) => l());
}

export function isBriefingSessionActive(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(BRIEFING_SESSION_STORAGE_KEY) === "1";
}

export function setBriefingSessionActive(): void {
  window.localStorage.setItem(BRIEFING_SESSION_STORAGE_KEY, "1");
  notify();
}

export function clearBriefingSession(): void {
  window.localStorage.removeItem(BRIEFING_SESSION_STORAGE_KEY);
  notify();
}

/**
 * True when the bundle is running in a non-prod environment (local dev,
 * UAT, staging) where surfacing a "Sign out of Briefings / Deep Dive"
 * affordance is useful for testers + repeated full-flow runs. False on
 * prod (`www.odum-research.com`), where prospective clients shouldn't
 * be prompted to sign out of something they just unlocked - it reads
 * as scary ("am I being signed out of something I paid for?") and
 * forces an unnecessary access-code re-entry on the next visit.
 *
 * Detection: NEXT_PUBLIC_SITE_URL absence (local dev) or its inclusion
 * of "uat." or "localhost". Prod baking has NEXT_PUBLIC_SITE_URL set to
 * https://www.odum-research.com which fails the check.
 */
export function isNonProdBriefingsEnv(): boolean {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  if (!siteUrl) return true;
  if (siteUrl.includes("www.odum-research.com")) return false;
  return true;
}

/**
 * Reactive hook for the briefing session state. Same-tab changes (via
 * set/clear above) fire through the in-memory listener set; cross-tab changes
 * arrive via the native `storage` event.
 */
export function useBriefingSession(): boolean {
  const subscribe = React.useCallback((onChange: () => void) => {
    listeners.add(onChange);
    const handler = (event: StorageEvent) => {
      if (event.key === BRIEFING_SESSION_STORAGE_KEY) onChange();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("storage", handler);
    }
    return () => {
      listeners.delete(onChange);
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handler);
      }
    };
  }, []);
  return React.useSyncExternalStore(subscribe, isBriefingSessionActive, () => false);
}
