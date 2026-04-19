"use client";

import Link from "next/link";
import {
  ArrowRight,
  Grid3x3,
  ListFilter,
  ShieldBan,
  TimerReset,
  Users,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ARCHETYPE_COVERAGE, allCoverageCells, blockedCells } from "@/lib/architecture-v2";

const ROUTES: ReadonlyArray<{
  href: string;
  title: string;
  description: string;
  icon: typeof Grid3x3;
  audience: string;
}> = [
  {
    href: "/services/strategy-catalogue/coverage",
    title: "Master matrix",
    description:
      "The canonical (archetype × category × instrument type) universe. Every cell is a capability statement: supported today, partial, blocked, or N/A.",
    icon: Grid3x3,
    audience: "admin / im_desk",
  },
  {
    href: "/services/strategy-catalogue/coverage/by-combination",
    title: "Combinatoric discovery",
    description:
      "Leg-picker: pick (category × instrument_type) for each leg and see every archetype that supports that combination (pair-trades, arbs, spreads).",
    icon: ListFilter,
    audience: "admin / im_desk",
  },
  {
    href: "/services/strategy-catalogue/coverage/blocked",
    title: "Block-list browser",
    description:
      "Every BLOCKED cell with its grouped reason, remediation, and UAC gap reference. Drives the capability backlog.",
    icon: ShieldBan,
    audience: "admin / im_desk",
  },
  {
    href: "/services/strategy-catalogue/admin/lock-state",
    title: "Admin toggle",
    description:
      "Flip a slot's lock state or incident-response demote its maturity. Admin-only; emits STRATEGY_AVAILABILITY_CHANGED + narrow events.",
    icon: TimerReset,
    audience: "admin",
  },
];

export default function StrategyCatalogueLandingPage() {
  const totalCells = allCoverageCells().length;
  const blocked = blockedCells().length;
  const archetypes = Object.keys(ARCHETYPE_COVERAGE).length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="platform-page-width space-y-8 p-6">
        <header className="space-y-3">
          <div className="flex items-center gap-2">
            <h1 className="text-page-title font-semibold tracking-tight">Strategy Catalogue</h1>
            <Badge variant="outline" className="font-mono text-xs">
              top-level service
            </Badge>
          </div>
          <p className="text-body text-muted-foreground max-w-3xl">
            The control centre for the firm&apos;s fixed universe of strategies. This service owns
            the coverage matrix, the maturity ladder, the lock-state registry, the
            promotion-decision ledger, the config-knob surface, and the codex deep-links.
            Downstream services (Research, Trading, Investment Management, Client Reporting)
            consume from this registry, scoped by RBAC + lock state.
          </p>
          <p className="text-body text-muted-foreground max-w-3xl">
            Users never &ldquo;create strategies out of thin air&rdquo; — they parameterize within
            the fixed universe. The SaaS vs Investment-Management split is a metadata-only concern:
            same engine code, different catalogue visibility.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Archetypes</CardDescription>
              <CardTitle className="text-3xl">{archetypes}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              8 families · 18 archetype code paths · zero duplication
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Coverage cells</CardDescription>
              <CardTitle className="text-3xl">{totalCells}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              enumerated in the master matrix (SUPPORTED | PARTIAL | BLOCKED)
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Blocked today</CardDescription>
              <CardTitle className="text-3xl text-amber-500">{blocked}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              see block-list browser for remediation + UAC-gap references
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {ROUTES.map((route) => {
            const Icon = route.icon;
            return (
              <Link
                key={route.href}
                href={route.href}
                className="group block rounded-lg border border-border/60 bg-card p-5 transition-colors hover:border-ring hover:bg-accent/30"
              >
                <div className="flex items-start gap-3">
                  <Icon className="size-5 text-muted-foreground" aria-hidden />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-heading font-medium">{route.title}</h2>
                      <ArrowRight
                        className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">{route.description}</p>
                    <div className="flex items-center gap-1 pt-1 text-xs text-muted-foreground">
                      <Users className="size-3" aria-hidden /> {route.audience}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>

        <section className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Downstream consumers</p>
          <ul className="mt-2 space-y-1">
            <li>
              <span className="font-mono text-xs">/services/research/strategies</span> — iteration
              surface for trading-platform subscribers (backtest playground within fixed universe).
            </li>
            <li>
              <span className="font-mono text-xs">/services/trading/strategies</span> — promoted-to-live
              view (live vs. backtest delta; auto-applied on the client&apos;s own infrastructure).
            </li>
            <li>
              <span className="font-mono text-xs">/services/investment-management/catalog</span> —
              IM desk view (full universe minus pre-audited placeholders).
            </li>
            <li>
              Client reporting tool &rarr; IM-client catalogue (allocated + aspirational).
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
