"use client";

/**
 * Cookie consent banner — GDPR / PECR compliance for the localStorage that
 * the briefings access gate, the Deep Dive session, and the questionnaire
 * draft autosave write. Renders fixed-bottom on the public marketing surface
 * until the user accepts or declines; persists the choice to localStorage so
 * the same browser session sees it once.
 *
 * What we tell the user:
 *   - We store a small flag in your browser (localStorage) to remember that
 *     you've unlocked the Deep Dive briefings hub and to autosave any
 *     questionnaire you start.
 *   - No third-party analytics or ad tracking.
 *   - You can clear by clearing your browser site data.
 *
 * Decline behaviour: we still set the consent flag (so the banner doesn't
 * keep showing), but the briefings session won't persist across page reloads
 * — they'll need to re-enter the access code each time. Questionnaire draft
 * is held in-memory only.
 */

import { useEffect, useState } from "react";

const CONSENT_KEY = "odum-cookie-consent";

export type ConsentState = "accepted" | "declined" | "unset";

/** Read consent from localStorage. Server-safe — returns "unset" off-window. */
export function readConsent(): ConsentState {
  if (typeof window === "undefined") return "unset";
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    if (v === "accepted" || v === "declined") return v;
    return "unset";
  } catch {
    return "unset";
  }
}

function writeConsent(value: "accepted" | "declined"): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* localStorage disabled — nothing to do */
  }
}

export function CookieConsentBanner(): React.ReactElement | null {
  const [state, setState] = useState<ConsentState>("unset");

  useEffect(() => {
    // Hydrate consent from localStorage on mount. The setState in an effect
    // is required: localStorage isn't available at SSR, so initial state must
    // be "unset" and we resolve it client-side. The effect runs once.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(readConsent());
  }, []);

  if (state !== "unset") return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      data-testid="cookie-consent-banner"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <div className="container mx-auto flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="text-xs text-muted-foreground md:max-w-3xl">
          We use a small browser flag so you don&apos;t have to re-enter your access code on every visit, and we
          autosave any questionnaire you start. No third-party analytics, no ad tracking. See our{" "}
          <a href="/privacy" className="font-medium text-foreground underline-offset-4 hover:underline">
            privacy notice
          </a>{" "}
          for the full breakdown.
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              writeConsent("declined");
              setState("declined");
            }}
            className="text-xs px-3 py-1.5 rounded border border-border text-muted-foreground hover:bg-muted/50"
            data-testid="cookie-consent-decline"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => {
              writeConsent("accepted");
              setState("accepted");
            }}
            className="text-xs px-3 py-1.5 rounded bg-foreground text-background font-medium hover:bg-foreground/90"
            data-testid="cookie-consent-accept"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
