"use client"

import * as React from "react"
import { AppShell } from "@/components/trading/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EntityLink } from "@/components/trading/entity-link"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Box,
  RefreshCw,
  Search,
  MoreHorizontal,
  Play,
  Shield,
  GitBranch,
  ArrowUpRight,
  History,
  Archive,
  ChevronRight,
  Trophy,
  Swords,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  Layers,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MODEL_FAMILIES, MODEL_VERSIONS, CHAMPION_CHALLENGER_PAIRS, LIVE_DEPLOYMENTS } from "@/lib/ml-mock-data"

// Context badge
function ContextBadge({ context }: { context: "BATCH" | "LIVE" }) {
  return (
    <Badge
      variant="outline"
      className={
        context === "LIVE"
          ? "bg-[var(--status-live)]/10 text-[var(--status-live)] border-[var(--status-live)]/30"
          : "bg-[var(--surface-ml)]/10 text-[var(--surface-ml)] border-[var(--surface-ml)]/30"
      }
    >
      {context}
    </Badge>
  )
}

// Status badge for model versions
function ModelStatusBadge({ status, isChampion, isChallenger }: { status: string; isChampion?: boolean; isChallenger?: boolean }) {
  if (isChampion) {
    return (
      <Badge className="bg-[var(--status-live)]/10 text-[var(--status-live)] border-[var(--status-live)]/30 gap-1">
        <Trophy className="size-3" />
        Champion
      </Badge>
    )
  }
  if (isChallenger) {
    return (
      <Badge className="bg-[var(--surface-ml)]/10 text-[var(--surface-ml)] border-[var(--surface-ml)]/30 gap-1">
        <Swords className="size-3" />
        Challenger
      </Badge>
    )
  }
  
  const colors: Record<string, string> = {
    live: "bg-[var(--status-live)]/10 text-[var(--status-live)] border-[var(--status-live)]/30",
    shadow: "bg-[var(--surface-ml)]/10 text-[var(--surface-ml)] border-[var(--surface-ml)]/30",
    validated: "bg-[var(--status-live)]/10 text-[var(--status-live)] border-[var(--status-live)]/30",
    validating: "bg-[var(--status-warning)]/10 text-[var(--status-warning)] border-[var(--status-warning)]/30",
    registered: "bg-muted text-muted-foreground",
    deprecated: "bg-muted text-muted-foreground",
    archived: "bg-muted text-muted-foreground/50",
  }
  
  const icons: Record<string, React.ReactNode> = {
    live: <Activity className="size-3" />,
    shadow: <Shield className="size-3" />,
    validated: <CheckCircle2 className="size-3" />,
    validating: <RefreshCw className="size-3" />,
    registered: <Box className="size-3" />,
    deprecated: <AlertTriangle className="size-3" />,
    archived: <Archive className="size-3" />,
  }
  
  return (
    <Badge variant="outline" className={`gap-1 ${colors[status] || ""}`}>
      {icons[status]}
      {status}
    </Badge>
  )
}

export default function ModelRegistryPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [archetypeFilter, setArchetypeFilter] = React.useState<string>("all")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [selectedFamily, setSelectedFamily] = React.useState<string | null>(MODEL_FAMILIES[0]?.id || null)
  
  // Filter model families
  const filteredFamilies = React.useMemo(() => {
    return MODEL_FAMILIES.filter(family => {
      const matchesSearch = family.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        family.id.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesArchetype = archetypeFilter === "all" || family.archetype === archetypeFilter
      return matchesSearch && matchesArchetype
    })
  }, [searchQuery, archetypeFilter])
  
  // Get versions for selected family
  const familyVersions = React.useMemo(() => {
    if (!selectedFamily) return []
    return MODEL_VERSIONS.filter(v => v.modelFamilyId === selectedFamily)
      .filter(v => statusFilter === "all" || v.status === statusFilter)
      .sort((a, b) => b.version.localeCompare(a.version))
  }, [selectedFamily, statusFilter])
  
  const selectedFamilyData = MODEL_FAMILIES.find(f => f.id === selectedFamily)
  const championVersion = familyVersions.find(v => v.isChampion)
  const challengerVersion = familyVersions.find(v => v.isChallenger)
  
  // Count stats
  const liveModels = MODEL_VERSIONS.filter(v => v.status === "live").length
  const shadowModels = MODEL_VERSIONS.filter(v => v.status === "shadow").length
  const totalVersions = MODEL_VERSIONS.length

  return (
    <AppShell
      activeSurface="ml"
      showLifecycleRail={false}
      breadcrumbs={[
        { label: "ML Platform", href: "/ml" },
        { label: "Model Registry" },
      ]}
      contextLevels={{ organization: true, client: false, strategy: false, underlying: false }}
    >
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Model Registry</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Model families, versions, champion/challenger management
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="size-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--surface-ml)]/10">
                <Layers className="size-5" style={{ color: "var(--surface-ml)" }} />
              </div>
              <div>
                <p className="text-2xl font-semibold">{MODEL_FAMILIES.length}</p>
                <p className="text-xs text-muted-foreground">Model Families</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Box className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{totalVersions}</p>
                <p className="text-xs text-muted-foreground">Total Versions</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--status-live)]/10">
                <Trophy className="size-5" style={{ color: "var(--status-live)" }} />
              </div>
              <div>
                <p className="text-2xl font-semibold">{liveModels}</p>
                <p className="text-xs text-muted-foreground">Live (Champions)</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--surface-ml)]/10">
                <Swords className="size-5" style={{ color: "var(--surface-ml)" }} />
              </div>
              <div>
                <p className="text-2xl font-semibold">{shadowModels}</p>
                <p className="text-xs text-muted-foreground">Shadow Testing</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--status-warning)]/10">
                <Activity className="size-5" style={{ color: "var(--status-warning)" }} />
              </div>
              <div>
                <p className="text-2xl font-semibold">{CHAMPION_CHALLENGER_PAIRS.length}</p>
                <p className="text-xs text-muted-foreground">Active A/B Tests</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search model families..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={archetypeFilter} onValueChange={setArchetypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Archetype" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Archetypes</SelectItem>
                <SelectItem value="DIRECTIONAL">Directional</SelectItem>
                <SelectItem value="MARKET_MAKING">Market Making</SelectItem>
                <SelectItem value="ARBITRAGE">Arbitrage</SelectItem>
                <SelectItem value="YIELD">Yield</SelectItem>
                <SelectItem value="SPORTS_ML">Sports ML</SelectItem>
                <SelectItem value="PREDICTION_MARKET_ML">Prediction ML</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-6">
          {/* Model Family List */}
          <Card className="col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Model Families</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1 px-4 pb-4">
                {filteredFamilies.map((family) => {
                  const hasChallenger = family.currentChallenger !== null
                  const deployment = LIVE_DEPLOYMENTS.find(d => 
                    MODEL_VERSIONS.find(m => m.id === d.modelVersionId)?.modelFamilyId === family.id
                  )
                  
                  return (
                    <div
                      key={family.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedFamily === family.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                      }`}
                      onClick={() => setSelectedFamily(family.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{family.name}</span>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-[10px]">{family.archetype}</Badge>
                        {deployment && <ContextBadge context="LIVE" />}
                        {hasChallenger && (
                          <Badge variant="outline" className="text-[10px] bg-[var(--surface-ml)]/10 text-[var(--surface-ml)]">
                            A/B Test
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{family.totalVersions} versions</span>
                        <span>{family.linkedStrategies.length} strategies</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Model Family Details */}
          <Card className="col-span-2">
            {selectedFamilyData ? (
              <>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-base">{selectedFamilyData.name}</CardTitle>
                        <Badge variant="outline">{selectedFamilyData.archetype}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{selectedFamilyData.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px] h-8">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="live">Live</SelectItem>
                          <SelectItem value="shadow">Shadow</SelectItem>
                          <SelectItem value="validated">Validated</SelectItem>
                          <SelectItem value="registered">Registered</SelectItem>
                          <SelectItem value="deprecated">Deprecated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Champion/Challenger Summary */}
                  {championVersion && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg border border-[var(--status-live)]/30 bg-[var(--status-live)]/5">
                        <div className="flex items-center gap-2 mb-3">
                          <Trophy className="size-4 text-[var(--status-live)]" />
                          <span className="font-medium">Champion</span>
                          <Badge variant="outline" className="font-mono text-xs ml-auto">
                            v{championVersion.version}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Sharpe</span>
                            <p className="font-mono font-semibold">{championVersion.metrics.sharpe.toFixed(2)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Accuracy</span>
                            <p className="font-mono font-semibold">{(championVersion.metrics.accuracy * 100).toFixed(1)}%</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Predictions</span>
                            <p className="font-mono">{championVersion.metrics.predictionCount.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Latency P50</span>
                            <p className="font-mono">{championVersion.metrics.inferenceLatencyP50}ms</p>
                          </div>
                        </div>
                      </div>
                      
                      {challengerVersion ? (
                        <div className="p-4 rounded-lg border border-[var(--surface-ml)]/30 bg-[var(--surface-ml)]/5">
                          <div className="flex items-center gap-2 mb-3">
                            <Swords className="size-4 text-[var(--surface-ml)]" />
                            <span className="font-medium">Challenger</span>
                            <Badge variant="outline" className="font-mono text-xs ml-auto">
                              v{challengerVersion.version}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Sharpe</span>
                              <p className={`font-mono font-semibold ${challengerVersion.metrics.sharpe > championVersion.metrics.sharpe ? "text-[var(--status-live)]" : ""}`}>
                                {challengerVersion.metrics.sharpe.toFixed(2)}
                                {challengerVersion.metrics.sharpe > championVersion.metrics.sharpe && " ↑"}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Accuracy</span>
                              <p className={`font-mono font-semibold ${challengerVersion.metrics.accuracy > championVersion.metrics.accuracy ? "text-[var(--status-live)]" : ""}`}>
                                {(challengerVersion.metrics.accuracy * 100).toFixed(1)}%
                                {challengerVersion.metrics.accuracy > championVersion.metrics.accuracy && " ↑"}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Shadow Predictions</span>
                              <p className="font-mono">{challengerVersion.metrics.predictionCount.toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Traffic Split</span>
                              <p className="font-mono">10%</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-lg border border-dashed border-border flex items-center justify-center">
                          <div className="text-center text-muted-foreground">
                            <Swords className="size-6 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No challenger configured</p>
                            <Button variant="outline" size="sm" className="mt-2">
                              Setup A/B Test
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Version History */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <History className="size-4" />
                        Version History
                      </h4>
                      <span className="text-xs text-muted-foreground">{familyVersions.length} versions</span>
                    </div>
                    <div className="space-y-2">
                      {familyVersions.map((version) => (
                        <div
                          key={version.id}
                          className="p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => router.push(`/ml/registry/${version.id}`)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="font-mono">v{version.version}</Badge>
                              <ModelStatusBadge status={version.status} isChampion={version.isChampion} isChallenger={version.isChallenger} />
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" className="size-8 p-0">
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <ArrowUpRight className="size-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <GitBranch className="size-4 mr-2" />
                                  View Lineage
                                </DropdownMenuItem>
                                {version.status === "validated" && (
                                  <DropdownMenuItem>
                                    <Play className="size-4 mr-2" />
                                    Deploy as Shadow
                                  </DropdownMenuItem>
                                )}
                                {version.status === "shadow" && (
                                  <DropdownMenuItem>
                                    <Swords className="size-4 mr-2" />
                                    Promote to Challenger
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Archive className="size-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          <div className="flex items-center gap-6 text-xs">
                            <span>
                              Sharpe: <span className="font-mono font-semibold">{version.metrics.sharpe.toFixed(2)}</span>
                            </span>
                            <span>
                              Accuracy: <span className="font-mono">{(version.metrics.accuracy * 100).toFixed(1)}%</span>
                            </span>
                            <span>
                              Max DD: <span className="font-mono">{(version.metrics.maxDrawdown * 100).toFixed(1)}%</span>
                            </span>
                            <span className="text-muted-foreground ml-auto">
                              Registered {new Date(version.registeredAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Linked Strategies */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Linked Strategies</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedFamilyData.linkedStrategies.map((strategyId) => (
                        <EntityLink
                          key={strategyId}
                          type="strategy"
                          id={strategyId}
                          label={strategyId}
                          className="text-sm"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Asset Classes */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Asset Classes</h4>
                    <div className="flex gap-2">
                      {selectedFamilyData.assetClasses.map((ac) => (
                        <Badge key={ac} variant="outline">{ac}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <div className="flex items-center justify-center h-[600px] text-muted-foreground">
                Select a model family to view details
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
