"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

// Map each demo persona to its paired tier counterpart.
const TOGGLE_MAP: Record<string, string> = {
  "desmond-dart-full": "desmond-signals-in",
  "desmond-signals-in": "desmond-dart-full",
  "elysium-defi": "elysium-defi-full",
  "elysium-defi-full": "elysium-defi",
};

// Personas where the named ID represents the full/upgraded tier.
const FULL_TIER_IDS = new Set([
  "desmond-dart-full",
  "elysium-defi-full",
]);

function tierLabel(personaId: string): string {
  if (personaId.endsWith("-dart-full")) return "DART Full";
  if (personaId.endsWith("-signals-in")) return "Signals-In";
  if (personaId.endsWith("-defi-full")) return "DeFi Full";
  if (personaId === "elysium-defi") return "DeFi Base";
  return "Demo";
}

function nextTierLabel(personaId: string): string {
  const paired = TOGGLE_MAP[personaId];
  return paired ? tierLabel(paired) : "";
}

export function DemoPlanToggle() {
  const isDemoMode = process.env.NEXT_PUBLIC_AUTH_PROVIDER === "demo";
  const { user, loginByEmail } = useAuth();
  const router = useRouter();
  const [switching, setSwitching] = React.useState(false);

  if (!isDemoMode || !user) return null;

  const pairedId = TOGGLE_MAP[user.id];
  if (!pairedId) return null;

  const isFullTier = FULL_TIER_IDS.has(user.id);
  const currentLabel = tierLabel(user.id);
  const nextLabel = nextTierLabel(user.id);

  const handleSwitch = async () => {
    setSwitching(true);
    try {
      // DemoAuthProvider.login() accepts persona ID directly; no password needed.
      await loginByEmail(pairedId, "");
      router.refresh();
    } finally {
      setSwitching(false);
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
      onClick={() => void handleSwitch()}
      disabled={switching}
      title={`Switch demo to ${nextLabel}`}
      data-testid="demo-plan-toggle"
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          isFullTier ? "bg-emerald-500" : "bg-amber-500",
        )}
        aria-hidden
      />
      {switching ? "Switching…" : currentLabel}
    </Button>
  );
}
