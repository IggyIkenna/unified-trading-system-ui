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
  return React.useSyncExternalStore(
    subscribe,
    isBriefingSessionActive,
    () => false,
  );
}
