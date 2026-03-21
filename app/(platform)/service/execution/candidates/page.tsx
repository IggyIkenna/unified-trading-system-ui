"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { ExecutionNav } from "@/components/execution-platform/execution-nav"
import { 
  ShoppingBasket, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle,
  TrendingUp,
  Zap,
  Clock,
  ArrowRight,
} from "lucide-react"

// Mock candidate algos for promotion
const mockCandidates = [
  {
    id: "cand_1",
    algoId: "IS_ADAPTIVE_V2",
    algoName: "IS Adaptive V2",
    sourceEnv: "Paper",
    targetEnv: "Production",
    backtestPeriod: "2025-12-01 to 2026-03-01",
    paperPeriod: "2026-03-01 to 2026-03-15",
    metrics: {
      slippageVsArrival: -0.3,
      fillRate: 98.2,
      avgLatency: 12,
      orderCount: 1247,
    },
    improvement: {
      slippage: "+1.2 bps",
      fillRate: "+0.8%",
      latency: "-3ms",
    },
    status: "ready",
    addedAt: "2026-03-17T10:30:00Z",
    addedBy: "algo_team",
    checklist: {
      backtestComplete: true,
      paperTradingComplete: true,
      riskApproved: true,
      complianceApproved: false,
      opsApproved: false,
    },
  },
  {
    id: "cand_2",
    algoId: "SNIPER_V3",
    algoName: "Sniper V3",
    sourceEnv: "Paper",
    targetEnv: "Production",
    backtestPeriod: "2025-11-01 to 2026-02-01",
    paperPeriod: "2026-02-15 to 2026-03-10",
    metrics: {
      slippageVsArrival: 0.8,
      fillRate: 94.5,
      avgLatency: 8,
      orderCount: 892,
    },
    improvement: {
      slippage: "+2.1 bps",
      fillRate: "+1.2%",
      latency: "-5ms",
    },
    status: "pending_review",
    addedAt: "2026-03-16T14:20:00Z",
    addedBy: "quant_research",
    checklist: {
      backtestComplete: true,
      paperTradingComplete: true,
      riskApproved: false,
      complianceApproved: false,
      opsApproved: false,
    },
  },
  {
    id: "cand_3",
    algoId: "POV_SMART",
    algoName: "POV Smart",
    sourceEnv: "Backtest",
    targetEnv: "Paper",
    backtestPeriod: "2025-10-01 to 2026-03-01",
    paperPeriod: null,
    metrics: {
      slippageVsArrival: 0.1,
      fillRate: 96.8,
      avgLatency: 15,
      orderCount: 5420,
    },
    improvement: {
      slippage: "+0.9 bps",
      fillRate: "+0.5%",
      latency: "-2ms",
    },
    status: "needs_paper",
    addedAt: "2026-03-15T09:00:00Z",
    addedBy: "algo_team",
    checklist: {
      backtestComplete: true,
      paperTradingComplete: false,
      riskApproved: false,
      complianceApproved: false,
      opsApproved: false,
    },
  },
]

const statusConfig: Record<string, { label: string; color: string }> = {
  ready: { label: "Ready", color: "text-emerald-500" },
  pending_review: { label: "Pending Review", color: "text-amber-500" },
  needs_paper: { label: "Needs Paper", color: "text-blue-500" },
  blocked: { label: "Blocked", color: "text-red-500" },
}

export default function ExecutionCandidatesPage() {
  const [selectedCandidates, setSelectedCandidates] = React.useState<string[]>([])

  const toggleCandidate = (id: string) => {
    setSelectedCandidates(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const readyCandidates = mockCandidates.filter(c => c.status === "ready")
  const pendingCandidates = mockCandidates.filter(c => c.status !== "ready")

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <ExecutionNav />
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Promotion Candidates</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Review and approve algorithms for environment promotion
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <ShoppingBasket className="size-3" />
              {selectedCandidates.length} selected
            </Badge>
            <Button 
              disabled={selectedCandidates.length === 0}
              className="gap-2"
            >
              <ArrowRight className="size-4" />
              Promote Selected
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <CheckCircle2 className="size-4 text-emerald-500" />
                Ready for Promotion
              </div>
              <div className="text-2xl font-bold tabular-nums">{readyCandidates.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Clock className="size-4 text-amber-500" />
                Pending Review
              </div>
              <div className="text-2xl font-bold tabular-nums">
                {mockCandidates.filter(c => c.status === "pending_review").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Zap className="size-4 text-blue-500" />
                Needs Paper Trading
              </div>
              <div className="text-2xl font-bold tabular-nums">
                {mockCandidates.filter(c => c.status === "needs_paper").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <TrendingUp className="size-4" />
                Avg Improvement
              </div>
              <div className="text-2xl font-bold tabular-nums text-emerald-500">+1.4 bps</div>
            </CardContent>
          </Card>
        </div>

        {/* Candidates Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Algorithm Candidates</CardTitle>
            <CardDescription>Select candidates to batch promote or review individually</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Algorithm</TableHead>
                  <TableHead>Promotion Path</TableHead>
                  <TableHead className="text-right">Slippage vs Arrival</TableHead>
                  <TableHead className="text-right">Fill Rate</TableHead>
                  <TableHead className="text-right">Latency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Checklist</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockCandidates.map((candidate) => {
                  const status = statusConfig[candidate.status] || statusConfig.blocked
                  const checklistComplete = Object.values(candidate.checklist).filter(Boolean).length
                  const checklistTotal = Object.values(candidate.checklist).length
                  
                  return (
                    <TableRow 
                      key={candidate.id}
                      className={cn(
                        selectedCandidates.includes(candidate.id) && "bg-primary/5"
                      )}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedCandidates.includes(candidate.id)}
                          onCheckedChange={() => toggleCandidate(candidate.id)}
                          disabled={candidate.status !== "ready"}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{candidate.algoName}</div>
                        <div className="text-xs text-muted-foreground">{candidate.algoId}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Badge variant="outline" className="text-xs">{candidate.sourceEnv}</Badge>
                          <ArrowRight className="size-3 text-muted-foreground" />
                          <Badge variant="outline" className="text-xs">{candidate.targetEnv}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          "font-mono tabular-nums",
                          candidate.metrics.slippageVsArrival >= 0 ? "text-emerald-500" : "text-red-500"
                        )}>
                          {candidate.metrics.slippageVsArrival >= 0 ? "+" : ""}{candidate.metrics.slippageVsArrival.toFixed(1)} bps
                        </span>
                        <div className="text-xs text-emerald-500">{candidate.improvement.slippage} vs current</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono tabular-nums">{candidate.metrics.fillRate}%</span>
                        <div className="text-xs text-emerald-500">{candidate.improvement.fillRate}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono tabular-nums">{candidate.metrics.avgLatency}ms</span>
                        <div className="text-xs text-emerald-500">{candidate.improvement.latency}</div>
                      </TableCell>
                      <TableCell>
                        <span className={cn("text-sm font-medium", status.color)}>
                          {status.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${(checklistComplete / checklistTotal) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {checklistComplete}/{checklistTotal}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="gap-1">
                          Review
                          <ChevronRight className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Checklist Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Approval Checklist</CardTitle>
            <CardDescription>Required approvals before promotion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              {[
                { key: "backtestComplete", label: "Backtest Complete", icon: CheckCircle2 },
                { key: "paperTradingComplete", label: "Paper Trading", icon: Zap },
                { key: "riskApproved", label: "Risk Approval", icon: AlertTriangle },
                { key: "complianceApproved", label: "Compliance", icon: CheckCircle2 },
                { key: "opsApproved", label: "Ops Approval", icon: CheckCircle2 },
              ].map((item) => {
                const approvedCount = mockCandidates.filter(
                  c => c.checklist[item.key as keyof typeof c.checklist]
                ).length
                
                return (
                  <div key={item.key} className="text-center p-4 border rounded-lg">
                    <item.icon className={cn(
                      "size-8 mx-auto mb-2",
                      approvedCount === mockCandidates.length ? "text-emerald-500" : "text-muted-foreground"
                    )} />
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {approvedCount}/{mockCandidates.length} approved
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
