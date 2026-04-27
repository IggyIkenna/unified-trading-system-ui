"use client";

/**
 * Demo-session landing client.
 *
 * Funnel Coherence plan Workstream H. Sets the demo-session flag in this
 * browser, also unlocks the briefings session (one-token-two-doors), then
 * renders a small landing card with a "Open the demo" CTA pointing at the
 * relevant /services/* surface for the prospect's persona profile.
 *
 * The prospect is NOT auto-redirected — they see the landing card first
 * so the demo/UAT framing (mock data, no production credentials, etc.)
 * is established before they enter the surfaces.
 */

import * as React from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { setBriefingSessionActive } from "@/lib/briefings/session";
import { setDemoSessionActive } from "@/lib/auth/access-context";

interface DemoSessionDoc {
  readonly id: string;
  readonly prospect_email: string;
  readonly prospect_name: string;
  readonly persona_profile: string;
  readonly surfaces_in_scope: readonly string[];
  readonly expiresAt?: string;
}

const PERSONA_DESTINATIONS: Record<string, { href: string; label: string; tiles: readonly string[] }> = {
  "im-allocator": {
    href: "/services/reports/strategy-catalogue",
    label: "Open Reports + Strategy Catalogue",
    tiles: ["Reports tile (catalogue + own-account)"],
  },
  "dart-signals-in": {
    href: "/services/trading/overview",
    label: "Open DART (Signals-In) + Reports",
    tiles: ["DART tile (Signals-In subset)", "Reports tile"],
  },
  "dart-full": {
    href: "/services/research/overview",
    label: "Open DART (Full) + Reports",
    tiles: ["DART tile (full)", "Reports tile"],
  },
  "odum-signals-counterparty": {
    href: "/services/signals/dashboard",
    label: "Open Odum Signals + Reports",
    tiles: ["Odum Signals tile", "Reports tile"],
  },
  "investor-lp": {
    href: "/investor-relations",
    label: "Open Investor Relations + Reports",
    tiles: ["Investor Relations tile", "Reports tile"],
  },
  admin: {
    href: "/dashboard",
    label: "Open admin dashboard",
    tiles: ["All tiles (admin / internal)"],
  },
};

export default function DemoSessionClient({ session }: { session: DemoSessionDoc }) {
  // One-token-two-doors + demo-session activation.
  React.useEffect(() => {
    try {
      setDemoSessionActive(true);
      setBriefingSessionActive();
    } catch (err) {
      console.error("[demo-session/_client] activation failed", err);
    }
  }, []);

  const dest = PERSONA_DESTINATIONS[session.persona_profile] ?? PERSONA_DESTINATIONS.admin;
  const greetingName = session.prospect_name?.trim() || session.prospect_email;
  const expires = session.expiresAt
    ? new Date(session.expiresAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : null;

  return (
    <main className="max-w-3xl mx-auto px-4 py-12 md:px-6 space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Demo / UAT</Badge>
          <Badge variant="secondary">Private to {greetingName}</Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Your platform walkthrough</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          You&rsquo;re entering Odum&rsquo;s controlled demo / UAT context. The surfaces below are the same components
          we run for production clients, but configured with mock data, scoped to your evaluation answers, with mutating
          actions disabled. Every page carries a &ldquo;Demo / UAT&rdquo; banner so you know what you&rsquo;re looking
          at.
        </p>
      </header>

      <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
        <p className="font-semibold">What demo / UAT does NOT do</p>
        <ul className="mt-2 space-y-1 text-muted-foreground list-disc pl-5">
          <li>No production client data is loaded.</li>
          <li>No real account credentials accepted; no withdrawal or destructive actions available.</li>
          <li>No silent transition to production: sign-up + onboarding happen separately.</li>
        </ul>
      </div>

      <div className="rounded-lg border border-border/80 bg-card/40 p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Tiles in scope</p>
        <ul className="mt-3 space-y-1.5 text-sm">
          {dest.tiles.map((t) => (
            <li key={t} className="flex items-start gap-2">
              <span aria-hidden className="mt-1.5 inline-block size-1.5 rounded-full bg-primary/70" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
        {expires ? (
          <p className="mt-4 text-xs text-muted-foreground">
            Your demo session expires <span className="font-medium text-foreground">{expires}</span>.
          </p>
        ) : null}
        <div className="mt-6">
          <Button asChild>
            <Link href={dest.href}>{dest.label} &rarr;</Link>
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Briefings on{" "}
        <Link href="/briefings" className="underline">
          /briefings
        </Link>{" "}
        are unlocked for this browser while your demo session is active.
      </p>
    </main>
  );
}
