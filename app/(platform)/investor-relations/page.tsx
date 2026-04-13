"use client";

import Link from "next/link";
import {
  Shield,
  Presentation,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Landmark,
  LayoutGrid,
  CalendarClock,
  Lock,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import type { Entitlement } from "@/lib/config/auth";

const PRESENTATIONS = [
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
    entitlement: "investor-board" as Entitlement,
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
    entitlement: "investor-plan" as Entitlement,
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
    tags: ["Product Deck", "Client-Facing", "5 Engagement Levels"],
    entitlement: "investor-platform" as Entitlement,
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
    entitlement: "investor-im" as Entitlement,
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
    entitlement: "investor-regulatory" as Entitlement,
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
    entitlement: "investor-relations" as Entitlement,
  },
];

export default function InvestorRelationsPage() {
  const { hasEntitlement, isAdmin, isInternal } = useAuth();

  const canAccess = (entitlement: Entitlement) =>
    isAdmin() || isInternal() || hasEntitlement(entitlement);

  const visiblePresentations = PRESENTATIONS.filter((p) => canAccess(p.entitlement));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center gap-4">
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

      {/* Content */}
      <main className="mx-auto max-w-5xl px-6 py-16">
        <PageHeader
          className="mb-12"
          title="Investor Relations"
          description={
            <p className="text-lg">
              Presentations covering platform capabilities, commercial services, operational resilience, and regulatory
              compliance.
            </p>
          }
        />

        {visiblePresentations.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visiblePresentations.map((p) => (
              <Link
                key={p.id}
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
            ))}
          </div>
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
