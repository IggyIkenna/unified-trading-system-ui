"use client"

import * as React from "react"
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  MessageSquare,
  Rocket,
  Shield,
  Target,
  XCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { STRATEGY_CANDIDATES, BACKTEST_RUNS } from "@/lib/strategy-platform-mock-data"
import type { StrategyCandidate } from "@/lib/strategy-platform-types"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function reviewStateColor(state: StrategyCandidate["reviewState"]) {
  switch (state) {
    case "approved":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
    case "in_review":
      return "bg-blue-500/15 text-blue-400 border-blue-500/30"
    case "pending":
      return "bg-amber-500/15 text-amber-400 border-amber-500/30"
    case "rejected":
      return "bg-red-500/15 text-red-400 border-red-500/30"
    default:
      return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"
  }
}

function fmtPct(v: number) {
  return `${(v * 100).toFixed(1)}%`
}

function fmtNum(v: number, decimals = 2) {
  return v.toFixed(decimals)
}

// Approval workflow stages
const WORKFLOW_STAGES = [
  { key: "pending", label: "Pending", icon: Clock },
  { key: "in_review", label: "In Review", icon: Shield },
  { key: "approved", label: "Approved", icon: CheckCircle2 },
  { key: "promoted", label: "Promoted", icon: Rocket },
] as const

type PromotionTarget = "paper" | "live"

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CandidatesPage() {
  const [candidates, setCandidates] = React.useState<StrategyCandidate[]>(STRATEGY_CANDIDATES)
  const [promotionTargets, setPromotionTargets] = React.useState<
    Record<string, PromotionTarget | null>
  >({})
  const [commentDialog, setCommentDialog] = React.useState<string | null>(null)
  const [commentText, setCommentText] = React.useState("")

  function promoteCandidate(candidateId: string, target: PromotionTarget) {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== candidateId) return c
        return {
          ...c,
          reviewState: "approved" as const,
          reviewComments: [
            ...c.reviewComments,
            {
              id: `rc-${Date.now()}`,
              userId: "current_user",
              userName: "Current User",
              comment: `Promoted to ${target} trading`,
              createdAt: new Date().toISOString(),
            },
          ],
        }
      })
    )
    setPromotionTargets((prev) => ({ ...prev, [candidateId]: target }))
  }

  function rejectCandidate(candidateId: string) {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== candidateId) return c
        return { ...c, reviewState: "rejected" as const }
      })
    )
  }

  function addComment(candidateId: string) {
    if (!commentText.trim()) return
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== candidateId) return c
        return {
          ...c,
          reviewComments: [
            ...c.reviewComments,
            {
              id: `rc-${Date.now()}`,
              userId: "current_user",
              userName: "Current User",
              comment: commentText.trim(),
              createdAt: new Date().toISOString(),
            },
          ],
        }
      })
    )
    setCommentText("")
    setCommentDialog(null)
  }

  // Compute workflow stage for display
  function getWorkflowStageIndex(candidate: StrategyCandidate): number {
    const target = promotionTargets[candidate.id]
    if (target) return 3 // promoted
    switch (candidate.reviewState) {
      case "pending":
        return 0
      case "in_review":
        return 1
      case "approved":
        return 2
      case "rejected":
        return -1
      default:
        return 0
    }
  }

  const pendingCandidates = candidates.filter(
    (c) => c.reviewState === "pending" || c.reviewState === "in_review"
  )
  const resolvedCandidates = candidates.filter(
    (c) => c.reviewState === "approved" || c.reviewState === "rejected"
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Promotion Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pendingCandidates.length} pending &middot; {resolvedCandidates.length} resolved
          </p>
        </div>

        {/* Pending Candidates */}
        {pendingCandidates.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Target className="size-5 text-amber-400" />
              Awaiting Review
            </h2>
            {pendingCandidates.map((candidate) => {
              const bt = BACKTEST_RUNS.find((b) => b.id === candidate.backtestRunId)
              const m = candidate.metricsSnapshot
              const stageIdx = getWorkflowStageIndex(candidate)

              return (
                <Card key={candidate.id} className="border-border/50">
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {/* Top row: info + actions */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {bt?.templateName ?? candidate.configId}
                            </span>
                            <Badge variant="outline" className={reviewStateColor(candidate.reviewState)}>
                              {candidate.reviewState.replace(/_/g, " ")}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-mono">
                              v{candidate.configVersion}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{candidate.rationale}</p>
                          <p className="text-xs text-muted-foreground">
                            Selected by {candidate.selectedBy} on{" "}
                            {new Date(candidate.selectedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setCommentDialog(candidate.id)}
                          >
                            <MessageSquare className="size-3.5" />
                            Comment
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            onClick={() => rejectCandidate(candidate.id)}
                          >
                            <XCircle className="size-3.5" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                            onClick={() => promoteCandidate(candidate.id, "paper")}
                          >
                            Promote to Paper
                          </Button>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => promoteCandidate(candidate.id, "live")}
                          >
                            <Rocket className="size-3.5" />
                            Promote to Live
                          </Button>
                        </div>
                      </div>

                      {/* Metrics row */}
                      <div className="grid grid-cols-6 gap-4 rounded-lg border border-border/30 p-3">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sharpe</p>
                          <p className="text-lg font-bold font-mono">{fmtNum(m.sharpe)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Return</p>
                          <p className="text-lg font-bold font-mono">{fmtPct(m.totalReturn)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Max DD</p>
                          <p className="text-lg font-bold font-mono text-red-400">
                            {fmtPct(m.maxDrawdown)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sortino</p>
                          <p className="text-lg font-bold font-mono">{fmtNum(m.sortino)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Hit Rate</p>
                          <p className="text-lg font-bold font-mono">{fmtPct(m.hitRate)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            Profit Factor
                          </p>
                          <p className="text-lg font-bold font-mono">{fmtNum(m.profitFactor)}</p>
                        </div>
                      </div>

                      {/* Approval Workflow Visualization */}
                      <div className="flex items-center gap-2">
                        {WORKFLOW_STAGES.map((stage, idx) => {
                          const Icon = stage.icon
                          const isActive = idx <= stageIdx
                          const isCurrent = idx === stageIdx
                          return (
                            <React.Fragment key={stage.key}>
                              {idx > 0 && (
                                <ArrowRight
                                  className={`size-4 ${isActive ? "text-emerald-400" : "text-muted-foreground/30"}`}
                                />
                              )}
                              <div
                                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${
                                  isCurrent
                                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                    : isActive
                                      ? "text-emerald-400/70"
                                      : "text-muted-foreground/40"
                                }`}
                              >
                                <Icon className="size-3.5" />
                                {stage.label}
                              </div>
                            </React.Fragment>
                          )
                        })}
                      </div>

                      {/* Review Comments */}
                      {candidate.reviewComments.length > 0 && (
                        <div className="space-y-2 border-t border-border/30 pt-3">
                          <p className="text-xs font-medium text-muted-foreground">Comments</p>
                          {candidate.reviewComments.map((rc) => (
                            <div
                              key={rc.id}
                              className="flex items-start gap-2 text-sm"
                            >
                              <div className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                                {rc.userName}
                              </div>
                              <div>
                                <p>{rc.comment}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  {new Date(rc.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Resolved Candidates */}
        {resolvedCandidates.length > 0 && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="size-4" />
                Resolved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-xs text-muted-foreground">Strategy</TableHead>
                    <TableHead className="text-xs text-muted-foreground">Version</TableHead>
                    <TableHead className="text-xs text-muted-foreground">Status</TableHead>
                    <TableHead className="text-xs text-muted-foreground">Promoted To</TableHead>
                    <TableHead className="text-xs text-muted-foreground">Sharpe</TableHead>
                    <TableHead className="text-xs text-muted-foreground">Return</TableHead>
                    <TableHead className="text-xs text-muted-foreground">Selected By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resolvedCandidates.map((candidate) => {
                    const bt = BACKTEST_RUNS.find((b) => b.id === candidate.backtestRunId)
                    const target = promotionTargets[candidate.id]
                    return (
                      <TableRow key={candidate.id} className="border-border/30">
                        <TableCell className="font-medium">
                          {bt?.templateName ?? candidate.configId}
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">
                          v{candidate.configVersion}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={reviewStateColor(candidate.reviewState)}
                          >
                            {candidate.reviewState}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {target ? (
                            <Badge
                              variant="outline"
                              className={
                                target === "live"
                                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                  : "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
                              }
                            >
                              {target}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">--</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {fmtNum(candidate.metricsSnapshot.sharpe)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {fmtPct(candidate.metricsSnapshot.totalReturn)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {candidate.selectedBy}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {candidates.length === 0 && (
          <Card className="border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="size-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No candidates in the pipeline</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Add candidates from the Backtests page
              </p>
            </CardContent>
          </Card>
        )}

        {/* Comment Dialog */}
        <Dialog
          open={commentDialog !== null}
          onOpenChange={(open) => {
            if (!open) {
              setCommentDialog(null)
              setCommentText("")
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Review Comment</DialogTitle>
              <DialogDescription>
                Add a comment to the candidate review.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Comment</Label>
              <Input
                placeholder="Enter your review comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && commentDialog) {
                    addComment(commentDialog)
                  }
                }}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setCommentDialog(null)
                  setCommentText("")
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => commentDialog && addComment(commentDialog)}
                disabled={!commentText.trim()}
              >
                <MessageSquare className="size-4" />
                Add Comment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
