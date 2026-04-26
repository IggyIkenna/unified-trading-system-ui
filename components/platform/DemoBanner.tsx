"use client";

/**
 * DemoBanner — persistent "Demo / UAT — illustrative data only" banner.
 *
 * Funnel Coherence plan Workstream H7. Renders on every signed-in surface
 * when the active access context is `demo_uat`. Visual: small bar pinned
 * to the bottom-right of the viewport (non-intrusive but always visible).
 *
 * The banner reads its visibility from `clientHasDemoSession()` so it
 * appears on any page the demo-session token has unlocked.
 */

import * as React from "react";
import { clientHasDemoSession } from "@/lib/auth/access-context";

export function DemoBanner() {
  const [active, setActive] = React.useState(false);

  React.useEffect(() => {
    setActive(clientHasDemoSession());
    // Listen for storage events so the banner reacts if another tab flips
    // the flag (e.g. user signs out of the demo session).
    function onStorage() {
      setActive(clientHasDemoSession());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!active) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-50 max-w-xs rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-300 shadow-lg backdrop-blur-sm"
    >
      <p className="font-semibold uppercase tracking-wider">Demo / UAT</p>
      <p className="mt-0.5 text-amber-200/90">
        Illustrative data only. No production credentials. Mutating actions are disabled.
      </p>
    </div>
  );
}
