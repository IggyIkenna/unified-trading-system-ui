"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  getCurrentTier,
  getPairedTier,
  getTierBundleForEmail,
  setTierOverride,
} from "@/lib/auth/tier-override";
import { cn } from "@/lib/utils";

/**
 * DemoPlanToggle — flips the active client-side tier override for paired-
 * persona demos (Desmond Full ⇄ Signals-In, Patrick DeFi Full ⇄ DeFi Base).
 *
 * Decoupled from auth provider: works in demo-mode AND real Firebase. The
 * toggle writes to localStorage via `setTierOverride`; `useAuth()` reapplies
 * the override automatically (listening for the TIER_OVERRIDE_EVENT).
 *
 * No re-login, no signOut — the user object stays stable, only entitlements
 * flip. See `lib/auth/tier-override.ts` for the bundle definitions and
 * `codex/14-playbooks/demo-ops/staging-demo-setup.md` for the operator-side
 * checklist.
 */
export function DemoPlanToggle() {
  const { user } = useAuth();
  const [switching, setSwitching] = React.useState(false);

  // Render only when the signed-in user's email is in a TierBundle. Works
  // for both demo personas and real Firebase users — the bundle is the
  // single source of truth.
  const bundle = getTierBundleForEmail(user?.email);
  if (!user || !bundle) return null;

  const current = getCurrentTier(user.email);
  const paired = getPairedTier(user.email);
  if (!current || !paired) return null;

  const isFullTier = current.tone === "emerald";

  const handleSwitch = () => {
    setSwitching(true);
    try {
      setTierOverride(user.email, paired.key);
    } finally {
      // Re-render flush is event-driven via useAuth's listener; clearing the
      // local switching state on the next tick keeps the click feedback brief.
      setTimeout(() => setSwitching(false), 150);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "h-7 gap-1.5 px-2.5 text-[11px] font-medium",
        isFullTier
          ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          : "border-amber-300 text-amber-700 hover:bg-amber-50",
      )}
      onClick={handleSwitch}
      disabled={switching}
      title={`Switch demo to ${paired.label}`}
      data-testid="demo-plan-toggle"
      data-tier={current.key}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          isFullTier ? "bg-emerald-500" : "bg-amber-500",
        )}
        aria-hidden
      />
      {switching ? "Switching…" : current.label}
    </Button>
  );
}
