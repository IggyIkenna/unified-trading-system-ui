"use client";

import { BriefingSignOutLink } from "@/components/briefings/briefing-signout-link";
import { PLATFORM_MARKETING_NAV_LABEL } from "@/components/shell/nav-copy";
import { SERVICE_LABELS, BRIEFING_SLUGS } from "@/lib/copy/service-labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { useBriefingSession } from "@/lib/briefings/session";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Lock, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

const NAV_HOME = { href: "/", label: "Home" } as const;

// Public marketing nav per marketing_site_three_route_consolidation_2026_04_26 plan.
// Three engagement routes (Odum-Managed Strategies / DART Trading Infrastructure /
// Regulated Operating Models) + Who We Are. Display labels via SERVICE_LABELS SSOT
// (lib/copy/service-labels.ts); URL slugs unchanged.
//
// Odum Signals is no longer a top-level public route — it folds into DART as a
// capability (signals-in / Odum-provided / hybrid workflows are sub-sections of
// /platform). Legacy /signals + /platform/signals-in + /platform/full all 301-redirect
// to /platform via next.config.mjs.
const NAV_PUBLIC_ROUTES = [
  { href: "/investment-management", label: SERVICE_LABELS.investment.marketing },
  { href: "/platform", label: SERVICE_LABELS.dart.marketing },
  { href: "/regulatory", label: SERVICE_LABELS.regulatory.marketing },
  { href: "/who-we-are", label: "Who We Are" },
] as const;

const NAV_SECONDARY = [
  { href: "/story", label: "Story" },
  { href: "/contact", label: "Contact" },
] as const;

// Deep Dive: gated briefings hub + developer docs. The hub itself is locked
// behind an access code (see app/(public)/briefings/layout.tsx). To get a
// code, the "Request access code" link routes visitors to /questionnaire,
// which auto-unlocks them on submit and emails them a code for use in
// other browsers.
const DEEP_DIVE_HEADLINE = [
  { href: "/briefings", label: "Briefings hub" },
  { href: "/questionnaire", label: "Request access code" },
  { href: "/docs", label: "Developer docs" },
  { href: "/faq", label: "FAQ" },
] as const;

// Briefing pillars consolidated 6 → 3 per marketing_site_three_route_consolidation
// 2026-04-26 plan Phase 4. Old slugs (`platform`, `dart`, `dart-full`, `dart-signals-in`,
// `signals-out`) redirect to `dart-trading-infrastructure` via next.config.mjs; old
// `regulatory` redirects to `regulated-operating-models`. The DART briefing absorbs
// Signals-In + Full + Odum Signals as in-page sub-sections.
const DEEP_DIVE_BRIEFINGS = [
  { href: `/briefings/${BRIEFING_SLUGS.investment}`, label: SERVICE_LABELS.investment.marketing },
  { href: `/briefings/${BRIEFING_SLUGS.dart}`, label: SERVICE_LABELS.dart.marketing },
  { href: `/briefings/${BRIEFING_SLUGS.regulatory}`, label: SERVICE_LABELS.regulatory.marketing },
] as const;

function isNavItemActive(pathname: string, hash: string, itemHref: string): boolean {
  const [pathPart, hashPart] = itemHref.split("#");
  const normalizedHash = hashPart ? `#${hashPart}` : "";

  if (normalizedHash) {
    return pathname === pathPart && hash === normalizedHash;
  }

  if (pathname === "/" && pathPart === "/") {
    return hash === "" || hash === "#";
  }

  return pathname === itemHref || pathname === pathPart;
}

const NAV_DISMISSED_KEY = "odum.nav.dismissed";

export function SiteHeader() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const briefingSessionActive = useBriefingSession();
  const [hash, setHash] = React.useState("");
  const [mobileOpen, setMobileOpen] = React.useState(false);
  // Pre-unlock: Deep Dive section shows headline items only (Briefings hub /
  // Request access code / Developer docs / FAQ) and the per-pillar briefings
  // sub-list is collapsed behind a chevron. Post-unlock (briefing session
  // active OR user already on a /briefings/* page so they're already in):
  // sub-list auto-expands. User can still toggle manually.
  const [briefingsExpanded, setBriefingsExpanded] = React.useState(false);
  React.useEffect(() => {
    if (briefingSessionActive) setBriefingsExpanded(true);
  }, [briefingSessionActive]);

  const syncHashFromWindow = React.useCallback(() => {
    setHash(window.location.hash);
  }, []);

  React.useEffect(() => {
    syncHashFromWindow();
    window.addEventListener("hashchange", syncHashFromWindow);
    return () => window.removeEventListener("hashchange", syncHashFromWindow);
  }, [pathname, syncHashFromWindow]);

  // On first mount, auto-open nav drawer on desktop unless user has closed it before.
  // Mobile stays closed by default (too much viewport eating for first impression).
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = window.localStorage.getItem(NAV_DISMISSED_KEY) === "1";
    const isDesktop = window.matchMedia("(min-width: 1280px)").matches;
    if (!dismissed && isDesktop) {
      setMobileOpen(true);
    }
  }, []);

  const handleSheetOpenChange = React.useCallback((open: boolean) => {
    setMobileOpen(open);
    if (!open && typeof window !== "undefined") {
      window.localStorage.setItem(NAV_DISMISSED_KEY, "1");
    }
  }, []);

  return (
    <header
      data-shell="site-header"
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container flex min-h-14 items-center justify-between gap-3 px-4 py-2 md:px-6">
        {/* Logo — always navigates home across breakpoints. */}
        <Link href="/" className="flex shrink-0 items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/odum-logo.png" alt="Odum Research" className="size-9" />
          <div className="flex flex-col items-start gap-0.5 leading-tight">
            <span className="text-lg font-semibold">Odum Research</span>
            <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal leading-none">
              FCA 975797
            </Badge>
          </div>
        </Link>

        {/* Menu pill — single visible entry point to the nav Sheet, all breakpoints. */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open full site navigation"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/60 bg-background/40 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:bg-accent hover:text-foreground sm:px-3"
        >
          <Menu className="size-3.5" aria-hidden />
          <span className="hidden sm:inline">Menu</span>
        </button>

        {/* Mobile + desktop Menu-pill nav sheet.
            Auto-opens on first desktop visit, stays closed after user dismisses. */}
        <Sheet open={mobileOpen} onOpenChange={handleSheetOpenChange}>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="border-b border-border/40 px-4 py-3">
              <SheetTitle className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/odum-logo.png" alt="Odum Research" className="size-8" />
                <span className="text-base font-semibold">Odum Research</span>
              </SheetTitle>
              <SheetDescription className="sr-only">
                Primary site navigation. Select a link to navigate, or press Escape to close.
              </SheetDescription>
            </SheetHeader>
            <nav className="flex flex-col gap-1 overflow-y-auto px-3 py-4">
              {[NAV_HOME, ...NAV_PUBLIC_ROUTES].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                    isNavItemActive(pathname, hash, item.href)
                      ? "bg-accent font-medium text-accent-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-3 border-t border-border/40 pt-3">
                {/*
                  Deep Dive — single bordered lock card. Pre-unlock: shows
                  the lock icon, an "ACCESS CODE REQUIRED" tag, and a
                  "Request access →" link to /questionnaire. Post-unlock:
                  chevron expands to reveal the briefings hub + per-pillar
                  list + non-prod sign-out. One affordance, easy to grok.
                */}
                <button
                  type="button"
                  onClick={() => setBriefingsExpanded((v) => !v)}
                  aria-expanded={briefingsExpanded}
                  aria-controls="deep-dive-content"
                  data-testid="deep-dive-toggle"
                  className={cn(
                    "flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                    briefingSessionActive ? "border-border/50 text-foreground" : "border-amber-500/40 text-foreground",
                  )}
                >
                  <span className="flex items-center gap-2">
                    {briefingSessionActive ? null : <Lock className="size-4 text-amber-500" aria-hidden />}
                    <span className="font-semibold">Deep Dive</span>
                  </span>
                  {briefingsExpanded ? (
                    <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
                  ) : (
                    <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                  )}
                </button>
                {!briefingSessionActive && !briefingsExpanded ? (
                  <div className="mt-1 flex flex-col gap-0.5 px-3" data-testid="deep-dive-locked-summary">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-500">
                      Access code required
                    </span>
                    <Link
                      href="/questionnaire"
                      onClick={() => setMobileOpen(false)}
                      className="text-sm font-medium text-cyan-400 hover:underline"
                      data-testid="deep-dive-request-access"
                    >
                      Request access →
                    </Link>
                  </div>
                ) : null}
                {briefingsExpanded ? (
                  <div id="deep-dive-content" className="mt-1">
                    {!briefingSessionActive ? (
                      <div className="mb-2 rounded-md bg-amber-500/5 px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-500">
                          Access code required
                        </p>
                        <Link
                          href="/questionnaire"
                          onClick={() => setMobileOpen(false)}
                          className="mt-0.5 inline-block text-sm font-medium text-cyan-400 hover:underline"
                        >
                          Request access →
                        </Link>
                      </div>
                    ) : null}
                    {DEEP_DIVE_HEADLINE.filter((item) =>
                      // Hide "Request access code" once unlocked — they don't need that path anymore.
                      briefingSessionActive ? item.href !== "/questionnaire" : true,
                    ).map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "block rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                          isNavItemActive(pathname, hash, item.href)
                            ? "bg-accent font-medium text-accent-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {item.label}
                      </Link>
                    ))}
                    <div className="mt-1 ml-2 border-l border-border/30 pl-2">
                      {DEEP_DIVE_BRIEFINGS.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "block rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                            isNavItemActive(pathname, hash, item.href)
                              ? "bg-accent font-medium text-accent-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                    {/* Non-prod-only "Sign out of Briefings" — clears localStorage flag for testers. */}
                    <BriefingSignOutLink className="mt-1" />
                  </div>
                ) : null}
              </div>
              <div className="mt-3 border-t border-border/40 pt-3">
                {NAV_SECONDARY.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "block rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                      isNavItemActive(pathname, hash, item.href)
                        ? "bg-accent font-medium text-accent-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>
            <div className="border-t border-border/40 px-4 py-4">
              {!loading && user ? (
                <Button asChild className="w-full">
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                    Dashboard
                  </Link>
                </Button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="text-center text-sm text-muted-foreground hover:text-foreground"
                  >
                    Sign In
                  </Link>
                  {briefingSessionActive ? (
                    <>
                      <Button asChild className="w-full">
                        <Link href="/strategy-evaluation" onClick={() => setMobileOpen(false)}>
                          Submit Strategy Evaluation
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full">
                        <Link href="/contact" onClick={() => setMobileOpen(false)}>
                          Book a Fit Call
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <Button asChild className="w-full">
                      <Link href="/start-your-review" onClick={() => setMobileOpen(false)}>
                        Start Your Review
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Horizontal nav removed 2026-04-22 — Menu pill + Sheet drawer is the single wayfinding surface. */}
        <div className="flex-1" aria-hidden="true" />

        <div className="flex items-center gap-3">
          {!loading && user ? (
            <>
              <Link href="/dashboard" className="hidden text-sm text-muted-foreground hover:text-foreground xl:block">
                Dashboard
              </Link>
              <Button size="sm" variant="outline" asChild>
                <Link href="/dashboard" className="flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                    {user.displayName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                  <span className="hidden xl:inline">{user.displayName.split(" ")[0]}</span>
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden text-sm text-muted-foreground hover:text-foreground xl:block">
                Sign In
              </Link>
              {/*
                When the visitor is already past the briefings gate (i.e. they
                completed the questionnaire and are reading deep dives), the
                primary header CTA shouldn't keep saying "Start Your Review" —
                they've already started. Swap to "Submit Strategy Evaluation"
                with "Book a Fit Call" as a secondary, matching the Next-steps
                block at the bottom of the briefings hub. Pre-gate the CTA
                stays "Start Your Review".
              */}
              {briefingSessionActive ? (
                <>
                  <Link href="/contact" className="hidden text-sm text-muted-foreground hover:text-foreground xl:block">
                    Book a Fit Call
                  </Link>
                  <Button size="sm" asChild>
                    <Link href="/strategy-evaluation">Submit Strategy Evaluation</Link>
                  </Button>
                </>
              ) : (
                <Button size="sm" asChild>
                  <Link href="/start-your-review">Start Your Review</Link>
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
