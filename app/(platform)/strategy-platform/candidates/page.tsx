"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { StrategyPlatformNav } from "@/components/strategy-platform/strategy-nav"
import { 
  ShoppingBasket, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Clock,
  FileCheck,
  GitCompare,
  Trash2,
  Send
} from "lucide-react"

// Mock candidates in basket
const MOCK_CANDIDATES = [
  {
    id: "cand-1",
    strategyId: "ETH_BASIS_v3.2",
    backtestId: "bt-001",
    addedAt: "2 hours ago",
    addedBy: "alice@odum.com",
    status: "approved" as const,
    metrics: { sharpe: 1.82, returns: 24.3, maxDD: -8.2, winRate: 58.4 },
    checks: { riskLimits: true, configValid: true, dataQuality: true, backtestCoverage: true },
    notes: "Strong performance across all regimes. Ready for shadow trading.",
    championComparison: { sharpe: 1.65, returnsDelta: "+2.1%", ddDelta: "-0.4%" }
  },
  {
    id: "cand-2",
    strategyId: "BTC_MM_v2.1",
    backtestId: "bt-003",
    addedAt: "5 hours ago",
    addedBy: "bob@odum.com",
    status: "pending" as const,
    metrics: { sharpe: 1.45, returns: 18.7, maxDD: -12.1, winRate: 52.1 },
    checks: { riskLimits: true, configValid: true, dataQuality: false, backtestCoverage: true },
    notes: "Data quality issue flagged - missing 2 days in Feb.",
    championComparison: { sharpe: 1.52, returnsDelta: "-1.2%", ddDelta: "+1.8%" }
  },
  {
    id: "cand-3",
    strategyId: "SOL_ARB_v1.4",
    backtestId: "bt-007",
    addedAt: "1 day ago",
    addedBy: "carol@odum.com",
    status: "rejected" as const,
    metrics: { sharpe: 0.95, returns: 12.4, maxDD: -18.3, winRate: 48.9 },
    checks: { riskLimits: false, configValid: true, dataQuality: true, backtestCoverage: false },
    notes: "Failed risk limits check - max drawdown exceeds threshold.",
    championComparison: { sharpe: 1.21, returnsDelta: "-4.2%", ddDelta: "+6.1%" }
  },
  {
    id: "cand-4",
    strategyId: "DOGE_MOM_v1.0",
    backtestId: "bt-012",
    addedAt: "3 days ago",
    addedBy: "alice@odum.com",
    status: "pending" as const,
    metrics: { sharpe: 1.33, returns: 31.2, maxDD: -15.4, winRate: 51.2 },
    checks: { riskLimits: true, configValid: true, dataQuality: true, backtestCoverage: true },
    notes: "New strategy - needs additional review of edge cases.",
    championComparison: null
  },
]

const statusConfig = {
  approved: { label: "Approved", color: "text-emerald-500", bg: "bg-emerald-500/10", icon: CheckCircle2 },
  pending: { label: "Pending Review", color: "text-amber-500", bg: "bg-amber-500/10", icon: Clock },
  rejected: { label: "Rejected", color: "text-red-500", bg: "bg-red-500/10", icon: XCircle },
}

export default function StrategyCandidatesPage() {
  const [selectedCandidates, setSelectedCandidates] = React.useState<string[]>([])
  const [activeTab, setActiveTab] = React.useState("all")
  
  const toggleCandidate = (id: string) => {
    setSelectedCandidates(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }
  
  const filteredCandidates = activeTab === "all" 
    ? MOCK_CANDIDATES 
    : MOCK_CANDIDATES.filter(c => c.status === activeTab)
  
  const approvedCount = MOCK_CANDIDATES.filter(c => c.status === "approved").length
  const pendingCount = MOCK_CANDIDATES.filter(c => c.status === "pending").length
  const rejectedCount = MOCK_CANDIDATES.filter(c => c.status === "rejected").length

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-[1800px] mx-auto px-6 py-3">
          <StrategyPlatformNav />
        </div>
      </div>
      
      <div className="max-w-[1800px] mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-3">
              <ShoppingBasket className="size-6" />
              Candidate Basket
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Review and approve strategy candidates before promotion to live trading
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedCandidates.length > 0 && (
              <>
                <Button variant="outline" size="sm" className="text-red-500">
                  <Trash2 className="size-4 mr-2" />
                  Remove ({selectedCandidates.length})
                </Button>
                <Button size="sm">
                  <Send className="size-4 mr-2" />
                  Promote to Handoff
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{MOCK_CANDIDATES.length}</div>
                  <div className="text-xs text-muted-foreground">Total in Basket</div>
                </div>
                <ShoppingBasket className="size-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-emerald-500">{approvedCount}</div>
                  <div className="text-xs text-muted-foreground">Approved</div>
                </div>
                <CheckCircle2 className="size-8 text-emerald-500/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-amber-500">{pendingCount}</div>
                  <div className="text-xs text-muted-foreground">Pending Review</div>
                </div>
                <Clock className="size-8 text-amber-500/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-red-500">{rejectedCount}</div>
                  <div className="text-xs text-muted-foreground">Rejected</div>
                </div>
                <XCircle className="size-8 text-red-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs & Table */}
        <Card>
          <CardHeader className="pb-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All ({MOCK_CANDIDATES.length})</TabsTrigger>
                <TabsTrigger value="approved">Approved ({approvedCount})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
                <TabsTrigger value="rejected">Rejected ({rejectedCount})</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox 
                      checked={selectedCandidates.length === filteredCandidates.length && filteredCandidates.length > 0}
                      onCheckedChange={(checked) => {
                        setSelectedCandidates(checked ? filteredCandidates.map(c => c.id) : [])
                      }}
                    />
                  </TableHead>
                  <TableHead>Strategy</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Sharpe</TableHead>
                  <TableHead className="text-right">Returns</TableHead>
                  <TableHead className="text-right">Max DD</TableHead>
                  <TableHead>Checks</TableHead>
                  <TableHead>vs Champion</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.map(candidate => {
                  const status = statusConfig[candidate.status]
                  const StatusIcon = status.icon
                  const passedChecks = Object.values(candidate.checks).filter(Boolean).length
                  const totalChecks = Object.keys(candidate.checks).length
                  
                  return (
                    <TableRow key={candidate.id} className={cn(selectedCandidates.includes(candidate.id) && "bg-muted/50")}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedCandidates.includes(candidate.id)}
                          onCheckedChange={() => toggleCandidate(candidate.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{candidate.strategyId}</div>
                          <div className="text-xs text-muted-foreground">{candidate.backtestId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("gap-1", status.bg, status.color)}>
                          <StatusIcon className="size-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{candidate.metrics.sharpe.toFixed(2)}</TableCell>
                      <TableCell className={cn("text-right font-mono", candidate.metrics.returns >= 0 ? "text-emerald-500" : "text-red-500")}>
                        {candidate.metrics.returns >= 0 ? "+" : ""}{candidate.metrics.returns.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-500">
                        {candidate.metrics.maxDD.toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={(passedChecks / totalChecks) * 100} className="h-2 w-16" />
                          <span className="text-xs text-muted-foreground">{passedChecks}/{totalChecks}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {candidate.championComparison ? (
                          <div className="text-xs">
                            <span className={cn(
                              "font-mono",
                              candidate.championComparison.returnsDelta.startsWith("+") ? "text-emerald-500" : "text-red-500"
                            )}>
                              {candidate.championComparison.returnsDelta}
                            </span>
                            <span className="text-muted-foreground ml-1">ret</span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs">New</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">{candidate.addedAt}</div>
                        <div className="text-xs text-muted-foreground">{candidate.addedBy}</div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <ArrowRight className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Validation Checklist Legend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileCheck className="size-4" />
              Validation Checklist
            </CardTitle>
            <CardDescription>All checks must pass before a candidate can be promoted</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="flex items-center gap-2 p-3 rounded-lg border">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <div>
                  <div className="text-sm font-medium">Risk Limits</div>
                  <div className="text-xs text-muted-foreground">VaR, drawdown, concentration within bounds</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg border">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <div>
                  <div className="text-sm font-medium">Config Valid</div>
                  <div className="text-xs text-muted-foreground">Schema validation, parameter ranges</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg border">
                <AlertTriangle className="size-4 text-amber-500" />
                <div>
                  <div className="text-sm font-medium">Data Quality</div>
                  <div className="text-xs text-muted-foreground">No gaps, outliers handled, sufficient history</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg border">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <div>
                  <div className="text-sm font-medium">Backtest Coverage</div>
                  <div className="text-xs text-muted-foreground">All regimes tested, walk-forward validation</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
