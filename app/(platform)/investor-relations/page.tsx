"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIrArchiveMetadata } from "@/hooks/api/use-ir-archive-metadata";
import { useAuth } from "@/hooks/use-auth";
import type { Entitlement } from "@/lib/config/auth";
import {
  mergeIrDeckMetadata,
  type IrDeckPresentation,
  type PillarId,
} from "@/lib/investor-relations/merge-deck-metadata";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  CalendarClock,
  Landmark,
  LayoutGrid,
  Lock,
  Map as MapIcon,
  Presentation,
  Shield,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

const PILLARS: Array<{
  id: PillarId;
  title: string;
  summary: string;
}> = [
    {
      id: 1,
      title: "How we got here",
      summary: "History, opportunity, and why Odum now.",
    },
    {
      id: 2,
      title: "Where we are going",
      summary: "Roadmap, readiness, and capital trajectory.",
    },
    {
      id: 3,
      title: "Portal & website concept",
      summary: "Five paths, auth, and how to navigate the live site.",
    },
    {
      id: 4,
      title: "DR, security, and stack depth",
      summary: "Resilience narrative with deep DR deck linked for detail.",
    },
  ];

const PRESENTATIONS: readonly IrDeckPresentation[] = [
  {
    id: "board-presentation",
    title: "Board Presentation",
    subtitle: "One Unified Trading System",
    description:
      "12-slide strategic advisor deck — the problem, the solution, breadth, strategies, traction, three services, flywheel, and the ask.",
    href: "/investor-relations/board-presentation",
    icon: Presentation,
    color: "from-amber-500/20 to-amber-600/5",
    border: "border-amber-500/30 hover:border-amber-500/60",
    iconColor: "text-amber-500",
    tags: ["Strategic Advisors", "Commercial Model", "FCA Authorised"],
    entitlement: "investor-board",
    pillar: 1,
    status: "current",
    year: 2026,
    audienceTags: ["Board", "Advisors"],
  },
  {
    id: "plan-presentation",
    title: "Plan & Longevity",
    subtitle: "The Path to $100M",
    description:
      "Strategy availability timelines, service readiness matrix, capital trajectory from $7.5M to $100M, and 30-month milestone roadmap.",
    href: "/investor-relations/plan-presentation",
    icon: CalendarClock,
    color: "from-violet-500/20 to-violet-600/5",
    border: "border-violet-500/30 hover:border-violet-500/60",
    iconColor: "text-violet-500",
    tags: ["Growth Plan", "Strategy Timeline", "Capital Trajectory"],
    entitlement: "investor-plan",
    pillar: 2,
    status: "current",
    year: 2026,
    audienceTags: ["Board", "Finance"],
  },
  {
    id: "site-navigation",
    title: "Portal & website navigation",
    subtitle: "Five engagement paths",
    description:
      "Walks the board through public, lighter gate, IR, investment management, and platform surfaces — auth levels and where live vs fixture data matters.",
    href: "/investor-relations/site-navigation",
    icon: MapIcon,
    color: "from-sky-500/20 to-sky-600/5",
    border: "border-sky-500/30 hover:border-sky-500/60",
    iconColor: "text-sky-500",
    tags: ["Portal", "IA", "Navigation"],
    entitlement: "investor-board",
    pillar: 3,
    status: "current",
    year: 2026,
    audienceTags: ["Board", "IR"],
  },
  {
    id: "platform-presentation",
    title: "Trading Platform as a Service",
    subtitle: "Trading Infrastructure Without the Build",
    description:
      "Product deck for prospective platform clients — engagement levels, coverage breadth, backtest-to-live, alpha protection, pricing, and proof points.",
    href: "/investor-relations/platform-presentation",
    icon: LayoutGrid,
    color: "from-emerald-500/20 to-emerald-600/5",
    border: "border-emerald-500/30 hover:border-emerald-500/60",
    iconColor: "text-emerald-500",
    tags: ["Product Deck", "Client-Facing", "Engagement Levels"],
    entitlement: "investor-platform",
    pillar: "standalone",
    status: "current",
    year: 2026,
    audienceTags: ["Clients", "Platform"],
  },
  {
    id: "investment-presentation",
    title: "Investment Management",
    subtitle: "FCA-Authorised Discretionary Management",
    description:
      "Live performance ($7.5M, 30%+ annualised), strategy spectrum, investor portal, fee structure, and co-investment terms.",
    href: "/investor-relations/investment-presentation",
    icon: TrendingUp,
    color: "from-cyan-500/20 to-cyan-600/5",
    border: "border-cyan-500/30 hover:border-cyan-500/60",
    iconColor: "text-cyan-500",
    tags: ["Investment Management", "Performance", "Investor Portal"],
    entitlement: "investor-im",
    pillar: "standalone",
    status: "current",
    year: 2026,
    audienceTags: ["Allocators", "Clients"],
  },
  {
    id: "regulatory-presentation",
    title: "Regulatory Umbrella",
    subtitle: "FCA Regulatory Coverage",
    description:
      "Engagement options, authorised activities, client portal features, compliance support, and onboarding process.",
    href: "/investor-relations/regulatory-presentation",
    icon: Landmark,
    color: "from-rose-500/20 to-rose-600/5",
    border: "border-rose-500/30 hover:border-rose-500/60",
    iconColor: "text-rose-500",
    tags: ["Regulatory", "Regulatory Coverage", "Fund Structures"],
    entitlement: "investor-regulatory",
    pillar: "standalone",
    status: "current",
    year: 2026,
    audienceTags: ["Legal", "Compliance"],
  },
  {
    id: "disaster-recovery",
    title: "Disaster Recovery & Business Continuity",
    subtitle: "Operational Resilience Playbook",
    description:
      "Circuit breakers, autonomous AI recovery agents, key-person access matrix, real-time client alerting, and financial continuity protocols.",
    href: "/investor-relations/disaster-recovery",
    icon: ShieldAlert,
    color: "from-slate-500/20 to-slate-600/5",
    border: "border-slate-500/30 hover:border-slate-500/60",
    iconColor: "text-slate-500",
    tags: ["Circuit Breaker", "Access Matrix", "Client Alerts", "FCA Compliant"],
    entitlement: "investor-relations",
    pillar: 4,
    status: "current",
    year: 2026,
    audienceTags: ["Board", "Risk"],
  },
  {
    id: "archive-readiness-snapshot",
    title: "Archived readiness snapshot",
    subtitle: "Earlier plan narrative",
    description:
      "Historical snapshot preserved for archive; substantive updates live in Plan & Longevity.",
    href: "/investor-relations/plan-presentation",
    icon: CalendarClock,
    color: "from-zinc-500/15 to-zinc-600/5",
    border: "border-zinc-500/25 hover:border-zinc-500/50",
    iconColor: "text-zinc-400",
    tags: ["Archive", "Roadmap"],
    entitlement: "investor-plan",
    pillar: 2,
    status: "archive",
    year: 2024,
    audienceTags: ["Board"],
  },
];

export default function InvestorRelationsPage() {
  const { hasEntitlement, isAdmin, isInternal } = useAuth();
  const { data: irMeta } = useIrArchiveMetadata();
  const [year, setYear] = React.useState<string>("all");
  const [audience, setAudience] = React.useState<string>("all");

  const mergedPresentations = React.useMemo(
    () => mergeIrDeckMetadata(PRESENTATIONS, irMeta),
    [irMeta],
  );

  const canAccess = React.useCallback(
    (entitlement: Entitlement) => isAdmin() || isInternal() || hasEntitlement(entitlement),
    [hasEntitlement, isAdmin, isInternal],
  );

  const canSeeArchive = isAdmin() || isInternal() || hasEntitlement("investor-archive");

  const visiblePresentations = React.useMemo(
    () =>
      mergedPresentations.filter((p) => {
        if (!canAccess(p.entitlement)) return false;
        if (p.status === "archive" && !canSeeArchive) return false;
        return true;
      }),
    [canAccess, canSeeArchive, mergedPresentations],
  );

  const years = React.useMemo(() => {
    const ys = new Set<number>();
    for (const p of visiblePresentations) ys.add(p.year);
    return Array.from(ys).sort((a, b) => b - a);
  }, [visiblePresentations]);

  const audiences = React.useMemo(() => {
    const tags = new Set<string>();
    for (const p of visiblePresentations) for (const t of p.audienceTags) tags.add(t);
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [visiblePresentations]);

  const filterDeck = React.useCallback(
    (p: IrDeckPresentation) => {
      if (year !== "all" && String(p.year) !== year) return false;
      if (audience !== "all" && !p.audienceTags.includes(audience)) return false;
      return true;
    },
    [audience, year],
  );

  const pillarDecks = (pid: PillarId) =>
    visiblePresentations.filter((p) => p.pillar === pid && filterDeck(p));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <img src="/images/odum-logo.png" alt="Odum Research" className="size-7" />
            <span className="font-bold text-lg tracking-tight">
              ODUM<span className="text-primary">.</span>
            </span>
          </Link>
          <Badge variant="outline" className="text-xs">
            <Shield className="size-3 mr-1" />
            FCA 975797
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <PageHeader
          className="mb-10"
          title="Investor Relations"
          description={
            <p className="text-lg">
              Presentations grouped by narrative pillars, with current versus archive views. Archive requires the{" "}
              <code className="text-xs">investor-archive</code> entitlement (enabled on the investor demo persona).
              Live builds merge optional deck metadata from{" "}
              <code className="text-xs">client-reporting-api</code> (
              <code className="text-xs">/api/reporting/investor-relations/archive-metadata</code>
              ).
            </p>
          }
        />

        <section className="mb-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PILLARS.map((pillar) => (
            <Card key={pillar.id} className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Pillar {pillar.id}</CardTitle>
                <p className="text-sm font-medium text-foreground">{pillar.title}</p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>{pillar.summary}</p>
                <ul className="list-disc pl-4 space-y-1">
                  {pillarDecks(pillar.id).map((p) => (
                    <li key={p.id}>
                      <Link className="text-primary hover:underline" href={p.href}>
                        {p.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </section>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[140px] h-9" size="sm">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All years</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={audience} onValueChange={setAudience}>
            <SelectTrigger className="w-[180px] h-9" size="sm">
              <SelectValue placeholder="Audience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All audiences</SelectItem>
              {audiences.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {visiblePresentations.length > 0 ? (
          <Tabs defaultValue="current" className="space-y-8">
            <TabsList>
              <TabsTrigger value="current">Current</TabsTrigger>
              {canSeeArchive ? <TabsTrigger value="archive">Archive</TabsTrigger> : null}
            </TabsList>
            <TabsContent value="current" className="space-y-10">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {visiblePresentations
                  .filter((p) => p.status === "current" && p.pillar !== "standalone")
                  .filter(filterDeck)
                  .map((p) => (
                    <PresentationCard key={p.id} presentation={p} />
                  ))}
              </div>
              {visiblePresentations.some(
                (p) => p.status === "current" && p.pillar === "standalone" && filterDeck(p),
              ) ? (
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold">Standalone decks</h2>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {visiblePresentations
                      .filter((p) => p.status === "current" && p.pillar === "standalone")
                      .filter(filterDeck)
                      .map((p) => (
                        <PresentationCard key={`standalone-${p.id}`} presentation={p} />
                      ))}
                  </div>
                </div>
              ) : null}
            </TabsContent>
            {canSeeArchive ? (
              <TabsContent value="archive">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {visiblePresentations
                    .filter((p) => p.status === "archive")
                    .filter(filterDeck)
                    .map((p) => (
                      <PresentationCard key={p.id} presentation={p} />
                    ))}
                </div>
              </TabsContent>
            ) : null}
          </Tabs>
        ) : (
          <div className="text-center py-20">
            <Lock className="size-12 mx-auto mb-4 text-muted-foreground/50" />
            <h2 className="text-xl font-semibold mb-2">No presentations available</h2>
            <p className="text-muted-foreground">
              Contact ikenna@odum-research.com for access to relevant presentations.
            </p>
          </div>
        )}

        <p className="mt-12 text-xs text-muted-foreground text-center">
          Odum Research Ltd &middot; FCA Authorised &amp; Regulated &middot; Ref 975797 &middot; Confidential
        </p>
      </main>
    </div>
  );
}

function PresentationCard({ presentation: p }: { presentation: IrDeckPresentation }) {
  return (
    <Link
      href={p.href}
      className={cn(
        "group relative flex flex-col rounded-xl border bg-gradient-to-br p-8 transition-all duration-200",
        p.color,
        p.border,
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "flex size-12 items-center justify-center rounded-lg bg-background/80 border border-border",
            p.iconColor,
          )}
        >
          <p.icon className="size-6" />
        </div>
        <ArrowRight className="size-5 text-muted-foreground opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        <Badge variant="outline" className="text-[10px]">
          {p.status === "archive" ? "Archive" : "Current"}
        </Badge>
        <Badge variant="secondary" className="text-[10px]">
          {p.year}
        </Badge>
        {p.pillar !== "standalone" ? (
          <Badge variant="outline" className="text-[10px]">
            Pillar {p.pillar}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px]">
            Standalone
          </Badge>
        )}
      </div>

      <h2 className="text-xl font-bold tracking-tight">{p.title}</h2>
      <p className="mt-1 text-sm font-medium text-primary">{p.subtitle}</p>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">{p.description}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {p.tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-[10px] font-medium">
            {tag}
          </Badge>
        ))}
      </div>
    </Link>
  );
}
