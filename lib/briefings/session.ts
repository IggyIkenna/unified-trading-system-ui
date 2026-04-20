/** localStorage key for lighter-gate (briefings) — distinct from staging gate and Firebase session. */
export const BRIEFING_SESSION_STORAGE_KEY = "odum-briefing-session";

export function isBriefingSessionActive(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(BRIEFING_SESSION_STORAGE_KEY) === "1";
}

export function setBriefingSessionActive(): void {
  window.localStorage.setItem(BRIEFING_SESSION_STORAGE_KEY, "1");
}

export function clearBriefingSession(): void {
  window.localStorage.removeItem(BRIEFING_SESSION_STORAGE_KEY);
}
