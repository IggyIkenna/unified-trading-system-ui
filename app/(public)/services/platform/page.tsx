"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Layers,
  Building2,
  ArrowRight,
  Search,
  CheckCircle2,
  TrendingUp,
  Shield,
  Globe,
  Users,
  Briefcase,
  Plus,
} from "lucide-react"

// Mock organizations that have Strategy as a Service
const organizations = [
  {
    id: "odum-internal",
    name: "Odum Research (Internal)",
    type: "Principal",
    strategies: 17,
    aum: "$24.5M",
    status: "active",
    color: "text-emerald-400",
    description: "Internal proprietary trading across all asset classes",
    features: ["Full Access", "All Strategies", "Admin Rights"],
  },
  {
    id: "alpha-capital",
    name: "Alpha Capital Partners",
    type: "White-Label",
    strategies: 5,
    aum: "$12.8M",
    status: "active",
    color: "text-sky-400",
    description: "Crypto and DeFi focused fund using our infrastructure",
    features: ["Crypto Strategies", "DeFi Yield", "Custom Branding"],
  },
  {
    id: "meridian-quant",
    name: "Meridian Quantitative",
    type: "White-Label",
    strategies: 8,
    aum: "$45.2M",
    status: "active",
    color: "text-violet-400",
    description: "TradFi futures and options systematic trading",
    features: ["Futures Strategies", "Options Vol", "Full Platform"],
  },
  {
    id: "nexus-trading",
    name: "Nexus Trading Group",
    type: "White-Label",
    strategies: 3,
    aum: "$8.1M",
    status: "active",
    color: "text-amber-400",
    description: "Sports betting arbitrage and market making",
    features: ["Sports Strategies", "Arb Detection", "Live Odds"],
  },
  {
    id: "vertex-asset",
    name: "Vertex Asset Management",
    type: "Sub-Fund",
    strategies: 4,
    aum: "$18.9M",
    status: "active",
    color: "text-rose-400",
    description: "Multi-asset systematic fund as Odum sub-fund",
    features: ["Multi-Asset", "Sub-Fund", "Managed Service"],
  },
  {
    id: "demo-org",
    name: "Demo Organisation",
    type: "Demo",
    strategies: 17,
    aum: "$0",
    status: "demo",
    color: "text-slate-400",
    description: "Full platform demo with mock data",
    features: ["Full Demo", "Mock Data", "All Features"],
  },
]

const orgTypeConfig = {
  Principal: { icon: Building2, color: "bg-emerald-400/10 text-emerald-400" },
  "White-Label": { icon: Layers, color: "bg-sky-400/10 text-sky-400" },
  "Sub-Fund": { icon: Briefcase, color: "bg-rose-400/10 text-rose-400" },
  Demo: { icon: Globe, color: "bg-slate-400/10 text-slate-400" },
}

export default function PlatformOrgSelectionPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedOrg, setSelectedOrg] = React.useState<string | null>(null)

  const filteredOrgs = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelectOrg = (orgId: string) => {
    setSelectedOrg(orgId)
  }

  const handleContinue = () => {
    if (selectedOrg) {
      // Navigate to the Unified Trading Platform with org context
      router.push(`/platform/${selectedOrg}`)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="container px-4 py-12 md:px-6">
        <div className="mx-auto max-w-5xl">
          {/* Title */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-amber-400/10">
              <Layers className="size-8 text-amber-400" />
            </div>
            <h1 className="text-3xl font-bold">Strategy as a Service</h1>
            <p className="mt-2 text-muted-foreground">
              Select your organisation to access the Unified Trading Platform
            </p>
          </div>

          {/* Search */}
          <div className="mb-6 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search organisations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Plus className="mr-2 size-4" />
              Request New Org
            </Button>
          </div>

          {/* Organization Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {filteredOrgs.map((org) => {
              const TypeIcon = orgTypeConfig[org.type as keyof typeof orgTypeConfig]?.icon || Building2
              const typeColor = orgTypeConfig[org.type as keyof typeof orgTypeConfig]?.color || ""
              const isSelected = selectedOrg === org.id

              return (
                <Card
                  key={org.id}
                  className={cn(
                    "cursor-pointer transition-all duration-200",
                    isSelected
                      ? "border-primary ring-2 ring-primary/20"
                      : "hover:border-primary/50"
                  )}
                  onClick={() => handleSelectOrg(org.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("flex size-10 items-center justify-center rounded-lg", typeColor)}>
                          <TypeIcon className="size-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{org.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {org.type}
                            </Badge>
                            <Badge 
                              variant={org.status === "active" ? "default" : "secondary"} 
                              className="text-xs"
                            >
                              {org.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="size-5 text-primary" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-3">{org.description}</CardDescription>
                    
                    {/* Metrics */}
                    <div className="flex gap-4 border-t border-border pt-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className={cn("size-4", org.color)} />
                        <span className="text-sm">
                          <span className="font-medium">{org.strategies}</span>
                          <span className="text-muted-foreground"> strategies</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className={cn("size-4", org.color)} />
                        <span className="text-sm">
                          <span className="font-medium">{org.aum}</span>
                          <span className="text-muted-foreground"> AUM</span>
                        </span>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {org.features.map((feature) => (
                        <span
                          key={feature}
                          className="px-2 py-0.5 text-xs rounded-md bg-secondary text-secondary-foreground"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Continue Button */}
          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              disabled={!selectedOrg}
              onClick={handleContinue}
              className="min-w-[200px]"
            >
              Continue to Platform
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>

          {/* Info */}
          <div className="mt-8 rounded-lg border border-border bg-muted/50 p-4">
            <div className="flex items-start gap-3">
              <Users className="size-5 text-muted-foreground mt-0.5" />
              <div>
                <h4 className="font-medium">Organisation Access</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Each organisation has its own isolated environment with customised strategies,
                  branding, and access controls. White-label clients see only their allocated
                  strategies and data. Internal users can switch between organisations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* See It In Action */}
      <section className="border-t border-border">
        <div className="container px-4 py-16 md:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">See It In Action</h2>
              <p className="mt-2 text-muted-foreground">
                Preview the full platform pipeline from strategy design through ML model deployment to live execution.
              </p>
            </div>

            {/* Strategy Pipeline Preview */}
            <Card className="mb-6 border-amber-500/20">
              <CardHeader>
                <CardTitle className="text-base">Strategy Pipeline</CardTitle>
                <CardDescription>End-to-end workflow from research to live trading</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-4">
                  {[
                    { stage: "Research", count: "12 strategies", status: "Backtest" },
                    { stage: "Paper Trading", count: "5 strategies", status: "Validating" },
                    { stage: "Staged Rollout", count: "3 strategies", status: "10% capital" },
                    { stage: "Live Production", count: "17 strategies", status: "Full capital" },
                  ].map((item) => (
                    <div key={item.stage} className="rounded-lg border border-border/50 bg-muted/30 p-3 text-center">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">{item.stage}</div>
                      <div className="text-sm font-medium mt-1">{item.count}</div>
                      <Badge variant="outline" className="text-[10px] mt-1">{item.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ML Models + Execution Preview */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-amber-500/20">
                <CardHeader>
                  <CardTitle className="text-base">ML Models</CardTitle>
                  <CardDescription>Deployed model performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { model: "Alpha Signal v3.2", accuracy: "68.4%", status: "Live" },
                      { model: "Vol Forecast v2.1", accuracy: "72.1%", status: "Live" },
                      { model: "Regime Detector v1.8", accuracy: "81.3%", status: "Shadow" },
                    ].map((m) => (
                      <div key={m.model} className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2">
                        <div>
                          <div className="text-sm font-medium">{m.model}</div>
                          <div className="text-[10px] text-muted-foreground">{m.accuracy} accuracy</div>
                        </div>
                        <Badge variant="outline" className={`text-[10px] ${m.status === "Live" ? "border-emerald-500/30 text-emerald-400" : "border-amber-500/30 text-amber-400"}`}>
                          {m.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-amber-500/20">
                <CardHeader>
                  <CardTitle className="text-base">Execution Summary</CardTitle>
                  <CardDescription>Today&apos;s trading activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { label: "Orders Executed", value: "2,847" },
                      { label: "Notional Volume", value: "$18.4M" },
                      { label: "Avg Alpha", value: "+2.8bps" },
                      { label: "Active Venues", value: "28 / 33" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2">
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <span className="text-sm font-medium font-mono">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTAs */}
      <section className="border-t border-border">
        <div className="container px-4 py-16 md:px-6">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 text-center max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold mb-2">Ready to get started?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Book a live demo to see the platform, or create your account to start exploring.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild>
                <Link href="/contact?service=platform&action=demo">
                  Book a Live Demo
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Contact Sales</Link>
              </Button>
              <Button size="lg" variant="ghost" asChild>
                <Link href="/signup">Create Account</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
