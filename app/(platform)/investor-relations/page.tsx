"use client"

import Link from "next/link"
import { Shield, Presentation, ShieldAlert, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const PRESENTATIONS = [
  {
    id: "board-presentation",
    title: "Board Presentation",
    subtitle: "Unified Trading Infrastructure",
    description:
      "10-slide overview of the platform — data provision, execution, strategy, regulatory umbrella, autonomous AI operations, and commercial model.",
    href: "/investor-relations/board-presentation",
    icon: Presentation,
    color: "from-amber-500/20 to-amber-600/5",
    border: "border-amber-500/30 hover:border-amber-500/60",
    iconColor: "text-amber-500",
    tags: ["Platform Overview", "Commercial Model", "FCA Authorised"],
  },
  {
    id: "disaster-recovery",
    title: "Disaster Recovery & Business Continuity",
    subtitle: "Operational Resilience Playbook",
    description:
      "Circuit breakers, autonomous AI recovery agents, key-person access matrix, real-time client alerting, and financial continuity protocols.",
    href: "/investor-relations/disaster-recovery",
    icon: ShieldAlert,
    color: "from-cyan-500/20 to-cyan-600/5",
    border: "border-cyan-500/30 hover:border-cyan-500/60",
    iconColor: "text-cyan-500",
    tags: ["Circuit Breaker", "Access Matrix", "Client Alerts", "FCA Compliant"],
  },
]

export default function InvestorRelationsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/images/odum-logo.png"
              alt="Odum Research"
              className="size-7"
            />
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
        <div className="mb-12">
          <h1 className="text-4xl font-black tracking-tight">
            Investor Relations
          </h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl">
            Board-level presentations covering platform capabilities,
            operational resilience, and regulatory compliance.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {PRESENTATIONS.map((p) => (
            <Link
              key={p.id}
              href={p.href}
              className={cn(
                "group relative flex flex-col rounded-xl border bg-gradient-to-br p-8 transition-all duration-200",
                p.color,
                p.border
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={cn(
                    "flex size-12 items-center justify-center rounded-lg bg-background/80 border border-border",
                    p.iconColor
                  )}
                >
                  <p.icon className="size-6" />
                </div>
                <ArrowRight className="size-5 text-muted-foreground opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
              </div>

              <h2 className="text-xl font-bold tracking-tight">{p.title}</h2>
              <p className="mt-1 text-sm font-medium text-primary">
                {p.subtitle}
              </p>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">
                {p.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {p.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-[10px] font-medium"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-12 text-xs text-muted-foreground text-center">
          Odum Research Ltd &middot; FCA Authorised &amp; Regulated &middot; Ref
          975797 &middot; Confidential
        </p>
      </main>
    </div>
  )
}
