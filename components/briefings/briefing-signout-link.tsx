"use client";

/**
 * Sign-out-of-Briefings link — clears the localStorage flag set by
 * setBriefingSessionActive() so the next visit to /briefings or /our-story
 * shows the access-code gate again.
 *
 * Only renders in non-prod environments (local dev + UAT). Prod visitors
 * don't need this — the localStorage flag is theirs to clear via browser
 * settings, and surfacing a sign-out CTA on prod could read as scary
 * ("am I being signed out of something I paid for?"). Useful in non-prod
 * for testers + shared computers + repeated full-flow runs.
 *
 * Detection: NEXT_PUBLIC_SITE_URL absence (local dev) or its inclusion of
 * "uat." or "localhost". Prod baking has NEXT_PUBLIC_SITE_URL set to
 * https://www.odum-research.com which fails both checks.
 */

import { LogOut } from "lucide-react";
import { clearBriefingSession, useBriefingSession } from "@/lib/briefings/session";

function isNonProdEnvironment(): boolean {
  // Server side: trust the bundle's baked-in NEXT_PUBLIC_SITE_URL. Prod
  // bakes the www domain; UAT bakes uat; local dev typically has no value
  // or localhost.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  if (!siteUrl) return true; // local dev — no var set
  if (siteUrl.includes("www.odum-research.com")) return false; // prod
  return true; // uat or any other non-prod URL
}

export function BriefingSignOutLink({ className = "" }: { className?: string }) {
  const active = useBriefingSession();
  if (!isNonProdEnvironment()) return null;
  if (!active) return null;
  return (
    <button
      type="button"
      onClick={() => clearBriefingSession()}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground ${className}`}
      data-testid="briefing-signout-link"
      title="Clear the locally-stored Deep Dive session so the access-code gate re-prompts on next visit. Visible in dev / UAT only."
    >
      <LogOut className="size-3" aria-hidden />
      Sign out of Briefings
    </button>
  );
}
