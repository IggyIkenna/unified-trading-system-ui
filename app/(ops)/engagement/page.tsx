"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Database,
  LineChart,
  Layers,
  Zap,
  Briefcase,
  Shield,
  ArrowRight,
} from "lucide-react"
import { SiteHeader } from "@/components/shell/site-header"

const engagementModels = [
  {
    id: "data",
    name: "Data Access",
    icon: Database,
    color: "text-sky-400",
    borderColor: "border-sky-400/30",
    bgColor: "bg-sky-400/5",
    stages: ["Acquire"],
    description: "Normalised market data across five asset classes. One schema, one API, 128 venues.",
    model: "Subscription",
    details: [
      "TradFi, Crypto, DeFi, Sports, Predictions",
      "REST and WebSocket access",
      "Historical and real-time feeds",
      "ML signal overlays available",
    ],
    pricing: "Tiered by data scope and latency requirements",
  },
  {
    id: "research",
    name: "Research & Backtesting",
    icon: LineChart,
    color: "text-violet-400",
    borderColor: "border-violet-400/30",
    bgColor: "bg-violet-400/5",
    stages: ["Acquire", "Build"],
    description: "Strategy development infrastructure with cross-asset simulation capabilities.",
    model: "Compute credits",
    details: [
      "Cloud-based backtesting environment",
      "GPU compute for ML workloads",
      "Full historical data access",
      "Trade-level simulation output",
    ],
    pricing: "Usage-based compute pricing",
  },
  {
    id: "execution",
    name: "Execution as a Service",
    icon: Zap,
    color: "text-emerald-400",
    borderColor: "border-emerald-400/30",
    bgColor: "bg-emerald-400/5",
    stages: ["Promote", "Run", "Observe"],
    description: "Integrate existing signals into our execution stack. No strategy disclosure required.",
    model: "Performance-aligned",
    details: [
      "Smart order routing across 128 venues",
      "Execution algorithms library",
      "Best execution reporting",
      "TCA and slippage analytics",
    ],
    pricing: "Fees structured around execution quality versus benchmark",
  },
  {
    id: "platform",
    name: "Full Platform",
    icon: Layers,
    color: "text-amber-400",
    borderColor: "border-amber-400/30",
    bgColor: "bg-amber-400/5",
    stages: ["Acquire", "Build", "Promote", "Run", "Observe"],
    description: "End-to-end infrastructure access. The same platform we use to run our own capital.",
    model: "Enterprise licence",
    details: [
      "All data, research, and execution capabilities",
      "Strategy source code available",
      "White-label deployment options",
      "Dedicated support and training",
    ],
    pricing: "Annual licence with scope-based pricing",
  },
  {
    id: "investment",
    name: "Investment Management",
    icon: Briefcase,
    color: "text-rose-400",
    borderColor: "border-rose-400/30",
    bgColor: "bg-rose-400/5",
    stages: ["Manage", "Report"],
    description: "Discretionary capital management using our systematic strategies.",
    model: "Performance-aligned",
    details: [
      "Separately managed accounts",
      "Fund structure access",
      "Strategy selection or custom mandates",
      "Regular reporting and transparency",
    ],
    pricing: "Management and performance fee structures",
  },
  {
    id: "regulatory",
    name: "Regulatory Umbrella",
    icon: Shield,
    color: "text-slate-400",
    borderColor: "border-slate-400/30",
    bgColor: "bg-slate-400/5",
    stages: ["Manage", "Report"],
    description: "FCA Appointed Representative services for firms requiring UK regulatory coverage.",
    model: "Retainer",
    details: [
      "AR registration and setup",
      "Ongoing compliance supervision",
      "Regulatory reporting support",
      "Staff training and frameworks",
    ],
    pricing: "Setup fee plus monthly retainer",
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="border-b border-border">
        <div className="container px-4 py-16 md:px-6">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4">Commercial Models</Badge>
            <h1 className="text-3xl font-bold md:text-4xl">How We Work</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Clients engage with the platform at the lifecycle stage that fits their operating model. 
              Each service maps to specific stages, with commercial terms appropriate to the engagement.
            </p>
          </div>
        </div>
      </section>

      {/* Engagement Models */}
      <section className="container px-4 py-12 md:px-6">
        <div className="space-y-6">
          {engagementModels.map((model) => {
            const Icon = model.icon
            return (
              <Card key={model.id} className={`${model.borderColor} ${model.bgColor}`}>
                <CardHeader className="pb-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`size-10 rounded-lg bg-background border ${model.borderColor} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`size-5 ${model.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{model.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{model.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 md:justify-end">
                      {model.stages.map((stage) => (
                        <Badge key={stage} variant="outline" className="text-xs">
                          {stage}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Includes</div>
                      <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
                        {model.details.map((detail) => (
                          <li key={detail} className="text-sm text-muted-foreground flex items-center gap-2">
                            <div className={`size-1.5 rounded-full ${model.color.replace('text-', 'bg-')}`} />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-col justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Commercial Model</div>
                        <div className="font-semibold text-sm">{model.model}</div>
                        <div className="text-xs text-muted-foreground mt-1">{model.pricing}</div>
                      </div>
                      <Button variant="outline" size="sm" className="mt-4 w-full md:w-auto" asChild>
                        <Link href={`/contact?service=${model.id}`}>
                          Discuss Requirements
                          <ArrowRight className="ml-2 size-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Platform Coverage */}
      <section className="border-t border-border bg-muted/30">
        <div className="container px-4 py-12 md:px-6">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h2 className="text-xl font-bold mb-2">One Platform, Multiple Entry Points</h2>
            <p className="text-sm text-muted-foreground">
              Services are modular. Clients can combine offerings or expand over time as needs evolve.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">128</div>
              <div className="text-xs text-muted-foreground">Live Venues</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">5</div>
              <div className="text-xs text-muted-foreground">Asset Classes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">1.5M+</div>
              <div className="text-xs text-muted-foreground">Instruments</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">24/7</div>
              <div className="text-xs text-muted-foreground">Operations</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="border-t border-border">
        <div className="container px-4 py-12 md:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-xl font-bold mb-2">Ready to Discuss?</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Contact us to explore which engagement model fits your requirements. 
              We're happy to provide detailed terms and scope discussions.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link href="/contact">
                  Get in Touch
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">
                  View Platform Overview
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
