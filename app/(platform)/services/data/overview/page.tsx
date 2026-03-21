"use client"

/**
 * /portal/data — Data service portal for SIGNED-IN users.
 * Shows data status, instrument coverage, freshness monitoring.
 * NOT a marketing page — user is already authenticated.
 *
 * Internal: sees full registry, all venues, all gaps
 * External: sees subscription-filtered registry
 */

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Database, Clock, AlertTriangle,
  RefreshCw, Search, Globe, Activity,
} from "lucide-react"
import { ShardCatalogue } from "@/components/data/shard-catalogue"
import { FreshnessHeatmap } from "@/components/data/freshness-heatmap"
import { MOCK_SHARD_AVAILABILITY, MOCK_DATA_GAPS } from "@/lib/data-service-mock-data"
import { PLATFORM_STATS } from "@/lib/config/platform-stats"

// Pipeline status (inspired by deployment-ui DataStatusTab)
const PIPELINE_SERVICES = [
  { name: "instruments-service", category: "ALL", status: "healthy", lastRun: "2 min ago", shardsTotal: 128, shardsComplete: 128, shardsFailed: 0, coveragePct: 100 },
  { name: "market-tick-data-service", category: "CEFI", status: "healthy", lastRun: "5 min ago", shardsTotal: 48, shardsComplete: 47, shardsFailed: 1, coveragePct: 97.9 },
  { name: "market-tick-data-service", category: "TRADFI", status: "healthy", lastRun: "15 min ago", shardsTotal: 24, shardsComplete: 24, shardsFailed: 0, coveragePct: 100 },
  { name: "market-tick-data-service", category: "DEFI", status: "degraded", lastRun: "47 min ago", shardsTotal: 18, shardsComplete: 16, shardsFailed: 2, coveragePct: 88.9 },
  { name: "market-data-processing-service", category: "CEFI", status: "healthy", lastRun: "3 min ago", shardsTotal: 336, shardsComplete: 334, shardsFailed: 2, coveragePct: 99.4 },
  { name: "market-data-processing-service", category: "DEFI", status: "healthy", lastRun: "8 min ago", shardsTotal: 84, shardsComplete: 82, shardsFailed: 2, coveragePct: 97.6 },
  { name: "features-delta-one-service", category: "CEFI", status: "healthy", lastRun: "12 min ago", shardsTotal: 96, shardsComplete: 95, shardsFailed: 1, coveragePct: 99.0 },
  { name: "features-volatility-service", category: "ALL", status: "healthy", lastRun: "10 min ago", shardsTotal: 48, shardsComplete: 48, shardsFailed: 0, coveragePct: 100 },
]

const VENUE_STATUS = [
  { venue: "Binance", category: "CEFI", instruments: 342, coverage: 99.2, lastUpdate: "2 min ago", cloud: "GCP" },
  { venue: "OKX", category: "CEFI", instruments: 287, coverage: 98.8, lastUpdate: "3 min ago", cloud: "GCP" },
  { venue: "Bybit", category: "CEFI", instruments: 198, coverage: 97.5, lastUpdate: "5 min ago", cloud: "GCP" },
  { venue: "Deribit", category: "CEFI", instruments: 156, coverage: 99.0, lastUpdate: "2 min ago", cloud: "GCP" },
  { venue: "Databento", category: "TRADFI", instruments: 524, coverage: 98.4, lastUpdate: "15 min ago", cloud: "AWS" },
  { venue: "NYSE", category: "TRADFI", instruments: 312, coverage: 97.8, lastUpdate: "20 min ago", cloud: "AWS" },
  { venue: "CME", category: "TRADFI", instruments: 189, coverage: 99.1, lastUpdate: "12 min ago", cloud: "AWS" },
  { venue: "Uniswap V3", category: "DEFI", instruments: 45, coverage: 94.2, lastUpdate: "47 min ago", cloud: "GCP" },
  { venue: "Aave V3", category: "DEFI", instruments: 28, coverage: 96.1, lastUpdate: "30 min ago", cloud: "GCP" },
  { venue: "Hyperliquid", category: "DEFI", instruments: 67, coverage: 95.8, lastUpdate: "8 min ago", cloud: "GCP" },
  { venue: "Betfair", category: "SPORTS", instruments: 1200, coverage: 92.5, lastUpdate: "5 min ago", cloud: "GCP" },
  { venue: "Pinnacle", category: "SPORTS", instruments: 890, coverage: 93.1, lastUpdate: "10 min ago", cloud: "GCP" },
]

export default function PortalDataPage() {
  const { user, isInternal, hasEntitlement } = useAuth()
  const [search, setSearch] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all")

  if (!user) return null

  const isAdmin = isInternal()
  const hasDataPro = hasEntitlement("data-pro")

  // Filter venues by subscription
  const filteredVenues = VENUE_STATUS.filter(v => {
    if (isAdmin || hasDataPro) return true
    return v.category === "CEFI"
  }).filter(v => {
    if (categoryFilter !== "all") return v.category === categoryFilter
    return true
  }).filter(v => {
    if (!search) return true
    return v.venue.toLowerCase().includes(search.toLowerCase())
  })

  const totalInstruments = filteredVenues.reduce((s, v) => s + v.instruments, 0)
  const avgCoverage = filteredVenues.length > 0
    ? Math.round(filteredVenues.reduce((s, v) => s + v.coverage, 0) / filteredVenues.length * 10) / 10
    : 0

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-8 md:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Data Status</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isAdmin ? "Full registry across all venues and asset classes" : `${user.org.name} — subscription-filtered view`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isAdmin && (
              <Link href="/services/data-catalogue">
                <Badge variant="outline" className="text-xs cursor-pointer hover:bg-accent">
                  Manage Subscription
                </Badge>
              </Link>
            )}
            <Button variant="outline" size="sm">
              <RefreshCw className="size-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold font-mono text-sky-400">{filteredVenues.length}</div>
              <div className="text-xs text-muted-foreground">Active Venues</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold font-mono text-emerald-400">{totalInstruments.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Instruments</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className={cn("text-2xl font-bold font-mono", avgCoverage >= 97 ? "text-emerald-400" : avgCoverage >= 90 ? "text-yellow-400" : "text-red-400")}>
                {avgCoverage}%
              </div>
              <div className="text-xs text-muted-foreground">Avg Coverage</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold font-mono text-violet-400">{PLATFORM_STATS.assetClassCount}</div>
              <div className="text-xs text-muted-foreground">Asset Classes</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="status">
          <TabsList className="mb-6">
            <TabsTrigger value="status">
              <Activity className="mr-2 size-4" />
              Pipeline Status
            </TabsTrigger>
            <TabsTrigger value="venues">
              <Globe className="mr-2 size-4" />
              Venue Coverage
            </TabsTrigger>
            <TabsTrigger value="freshness">
              <Clock className="mr-2 size-4" />
              Data Freshness
            </TabsTrigger>
            <TabsTrigger value="catalogue">
              <Database className="mr-2 size-4" />
              Instrument Catalogue
            </TabsTrigger>
          </TabsList>

          {/* Pipeline Status */}
          <TabsContent value="status">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Data Pipeline Status</h2>
                <Badge variant="outline" className="text-xs">Last refreshed: just now</Badge>
              </div>
              <div className="space-y-2">
                {PIPELINE_SERVICES.map((svc, i) => (
                  <Card key={`${svc.name}-${svc.category}-${i}`}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("size-2.5 rounded-full",
                            svc.status === "healthy" ? "bg-emerald-500" :
                            svc.status === "degraded" ? "bg-yellow-500 animate-pulse" : "bg-red-500"
                          )} />
                          <span className="text-sm font-medium">{svc.name}</span>
                          <Badge variant="secondary" className="text-[10px]">{svc.category}</Badge>
                        </div>
                        <div className="flex items-center gap-6 text-xs text-muted-foreground">
                          <span>{svc.lastRun}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={svc.coveragePct} className="h-1.5 w-20" />
                            <span className={cn("font-mono", svc.coveragePct >= 99 ? "text-emerald-400" : svc.coveragePct >= 95 ? "text-yellow-400" : "text-red-400")}>
                              {svc.coveragePct}%
                            </span>
                          </div>
                          <span className="font-mono">
                            {svc.shardsComplete}/{svc.shardsTotal}
                            {svc.shardsFailed > 0 && <span className="text-red-400 ml-1">({svc.shardsFailed} failed)</span>}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {isAdmin && MOCK_DATA_GAPS.length > 0 && (
                <Card className="border-amber-500/20 bg-amber-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="size-4 text-amber-400" />
                      Data Gaps ({MOCK_DATA_GAPS.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1.5">
                      {MOCK_DATA_GAPS.map((gap, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span>{gap.venue} · {gap.dataType}</span>
                          <span className="text-muted-foreground">{gap.daysAffected} missing days</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Venue Coverage */}
          <TabsContent value="venues">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search venues..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
                <div className="flex gap-1.5">
                  {["all", "CEFI", "TRADFI", "DEFI", "SPORTS"].map(cat => (
                    <Button key={cat} variant={categoryFilter === cat ? "secondary" : "ghost"} size="sm" onClick={() => setCategoryFilter(cat)} className="h-7 text-xs">
                      {cat === "all" ? "All" : cat}
                    </Button>
                  ))}
                </div>
                {!isAdmin && !hasDataPro && (
                  <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">
                    Filtered by subscription (CEFI only)
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                {filteredVenues.map(v => (
                  <Card key={v.venue}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold">{v.venue}</span>
                          <Badge variant="secondary" className="text-[10px]">{v.category}</Badge>
                          <Badge variant="outline" className={cn("text-[10px]",
                            v.cloud === "GCP" ? "text-blue-400 border-blue-400/30" : "text-orange-400 border-orange-400/30"
                          )}>{v.cloud}</Badge>
                        </div>
                        <div className="flex items-center gap-6 text-xs">
                          <span className="text-muted-foreground">{v.instruments} instruments</span>
                          <span className="text-muted-foreground">{v.lastUpdate}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={v.coverage} className="h-1.5 w-16" />
                            <span className={cn("font-mono font-medium",
                              v.coverage >= 98 ? "text-emerald-400" : v.coverage >= 95 ? "text-yellow-400" : "text-red-400"
                            )}>{v.coverage}%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Data Freshness */}
          <TabsContent value="freshness">
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Data Freshness Monitoring</h2>
              {MOCK_SHARD_AVAILABILITY.map(shard => (
                <Card key={`${shard.venue}-${shard.dataType}`} className="border-sky-500/20">
                  <CardContent className="pt-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-base font-semibold capitalize">{shard.venue}</span>
                        <Badge variant="outline" className="text-xs">{shard.folder}</Badge>
                        {shard.gcpCompletionPct > 0 && <Badge variant="outline" className="text-xs text-blue-400 border-blue-400/30">GCP</Badge>}
                        {shard.awsCompletionPct > 0 && <Badge variant="outline" className="text-xs text-orange-400 border-orange-400/30">AWS</Badge>}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">{shard.datesChecked} days</span>
                        <span className="text-muted-foreground">{shard.datesMissing} gaps</span>
                        <span className={cn("font-mono font-bold",
                          shard.completionPct >= 96 ? "text-emerald-400" : shard.completionPct >= 90 ? "text-yellow-400" : "text-red-400"
                        )}>{shard.completionPct}%</span>
                      </div>
                    </div>
                    <FreshnessHeatmap dateMap={shard.byDate ?? {}} label={`${shard.dataType}`} cloud={shard.gcpCompletionPct > 0 ? "gcp" : "aws"} weeksToShow={13} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Instrument Catalogue */}
          <TabsContent value="catalogue">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">Instrument Catalogue</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {isAdmin
                  ? "Full instrument registry across all venues and asset classes."
                  : `Showing instruments available under your ${hasDataPro ? "Pro" : "Basic"} subscription.`}
              </p>
            </div>
            <ShardCatalogue orgMode={isAdmin ? "admin" : "client"} activeSubscriptions={[]} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
