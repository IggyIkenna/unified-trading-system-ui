"use client";

/**
 * Strip shown at the top of every /briefings/* page once the access-code
 * gate has unlocked. Two-pane:
 *
 *   [✓ Access granted]              Sign out of Deep Dive →
 *
 * The sign-out clears the localStorage flag and reloads, kicking the user
 * back to the lock screen (or to / if the route is the briefings hub
 * itself). Visible in every environment (prod included) — sign-out is a
 * standard expectation once you're "in" something. The non-prod-only
 * BriefingSignOutLink in the side-nav drawer is the secondary path for
 * users who haven't yet drilled into a briefing.
 */

import { LogOut, ShieldCheck } from "lucide-react";
import { clearBriefingSession } from "@/lib/briefings/session";
import { useRouter } from "next/navigation";

export function BriefingsAccessBadge(): React.ReactElement {
  const router = useRouter();
  return (
    <div data-testid="briefings-access-badge" className="border-b border-border/40 bg-background/60">
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-2 text-xs md:px-6">
        <span className="flex items-center gap-1.5 text-emerald-500">
          <ShieldCheck className="size-3.5" aria-hidden />
          <span className="font-medium">Access granted</span>
          <span className="ml-1 text-muted-foreground">: you&apos;re in the Deep Dive briefings hub.</span>
        </span>
        <button
          type="button"
          onClick={() => {
            clearBriefingSession();
            // After signing out, push them back to /story (the public
            // abridged surface) so they land on a page they still have
            // access to instead of getting bounced by the gate they just
            // logged out of.
            router.push("/story");
          }}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          data-testid="briefings-signout-button"
        >
          <LogOut className="size-3" aria-hidden />
          Sign out of Deep Dive
        </button>
      </div>
    </div>
  );
}
