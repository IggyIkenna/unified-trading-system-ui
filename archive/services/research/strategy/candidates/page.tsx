"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, Clock, MessageSquare, Rocket, Shield, Target, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";

import {
  useStrategyCandidates,
  useStrategyBacktests,
  usePromoteStrategy,
  useRejectStrategy,
} from "@/hooks/api/use-strategies";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/components/shared/api-error";
import { EmptyState } from "@/components/shared/empty-state";
import { CandidateBasket, useCandidateBasket } from "@/components/platform/candidate-basket";
import type { StrategyCandidate, BacktestRun } from "@/lib/types/strategy-platform";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function reviewStateColor(state: StrategyCandidate["reviewState"]) {
  switch (state) {
    case "approved":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "in_review":
      return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    case "pending":
      return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    case "rejected":
      return "bg-red-500/15 text-red-400 border-red-500/30";
    default:
      return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";
  }
}

function fmtPct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

function fmtNum(v: number, decimals = 2) {
  return v.toFixed(decimals);
}

// Approval workflow stages
const WORKFLOW_STAGES = [
  { key: "pending", label: "Pending", icon: Clock },
  { key: "in_review", label: "In Review", icon: Shield },
  { key: "approved", label: "Approved", icon: CheckCircle2 },
  { key: "promoted", label: "Promoted", icon: Rocket },
] as const;

type PromotionTarget = "paper" | "live";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CandidatesPage() {
  const router = useRouter();
  const {
    data: candidatesData,
    isLoading: candidatesLoading,
    isError: candidatesIsError,
    error: candidatesError,
    refetch: candidatesRefetch,
  } = useStrategyCandidates();
  const { data: backtestsData, isLoading: backtestsLoading } = useStrategyBacktests();
  const promoteStrategy = usePromoteStrategy();
  const rejectStrategy = useRejectStrategy();

  const candidatesFromApi = React.useMemo((): StrategyCandidate[] => {
    const raw = candidatesData as {
      data?: StrategyCandidate[];
      candidates?: StrategyCandidate[];
    };
    return raw?.data ?? raw?.candidates ?? [];
  }, [candidatesData]);

  const BACKTEST_RUNS = React.useMemo((): BacktestRun[] => {
    const raw = backtestsData as {
      data?: BacktestRun[];
      backtests?: BacktestRun[];
    };
    return raw?.data ?? raw?.backtests ?? [];
  }, [backtestsData]);

  const isLoading = candidatesLoading || backtestsLoading;
  const [candidates, setCandidates] = React.useState<StrategyCandidate[]>([]);
  const basket = useCandidateBasket();

  // Sync API data into local state when it arrives
  React.useEffect(() => {
    if (candidatesFromApi.length > 0) {
      setCandidates(candidatesFromApi);
    }
  }, [candidatesFromApi]);

  const [promotionTargets, setPromotionTargets] = React.useState<Record<string, PromotionTarget | null>>({});
  const [commentDialog, setCommentDialog] = React.useState<string | null>(null);
  const [commentText, setCommentText] = React.useState("");

  function promoteCandidate(candidateId: string, target: PromotionTarget) {
    promoteStrategy.mutate(candidateId);
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== candidateId) return c;
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
        };
      }),
    );
    setPromotionTargets((prev) => ({ ...prev, [candidateId]: target }));
  }

  function rejectCandidate(candidateId: string) {
    rejectStrategy.mutate(candidateId);
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== candidateId) return c;
        return { ...c, reviewState: "rejected" as const };
      }),
    );
  }

  function addComment(candidateId: string) {
    if (!commentText.trim()) return;
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== candidateId) return c;
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
        };
      }),
    );
    setCommentText("");
    setCommentDialog(null);
  }

  // Compute workflow stage for display
  function getWorkflowStageIndex(candidate: StrategyCandidate): number {
    const target = promotionTargets[candidate.id];
    if (target) return 3; // promoted
    switch (candidate.reviewState) {
      case "pending":
        return 0;
      case "in_review":
        return 1;
      case "approved":
        return 2;
      case "rejected":
        return -1;
      default:
        return 0;
    }
  }

  const pendingCandidates = candidates.filter((c) => c.reviewState === "pending" || c.reviewState === "in_review");
  const resolvedCandidates = candidates.filter((c) => c.reviewState === "approved" || c.reviewState === "rejected");

  const resolvedColumns: ColumnDef<StrategyCandidate, unknown>[] = React.useMemo(
    () => [
      {
        id: "strategy",
        header: "Strategy",
        enableSorting: false,
        cell: ({ row }) => {
          const bt = BACKTEST_RUNS.find((b) => b.id === row.original.backtestRunId);
          return <span className="font-medium">{bt?.templateName ?? row.original.configId}</span>;
        },
      },
      {
        accessorKey: "configVersion",
        header: "Version",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-muted-foreground font-mono text-xs">v{row.original.configVersion}</span>
        ),
      },
      {
        accessorKey: "reviewState",
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => (
          <Badge variant="outline" className={reviewStateColor(row.original.reviewState)}>
            {row.original.reviewState}
          </Badge>
        ),
      },
      {
        id: "promotedTo",
        header: "Promoted To",
        enableSorting: false,
        cell: ({ row }) => {
          const target = promotionTargets[row.original.id];
          if (target) {
            return (
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
            );
          }
          return <span className="text-muted-foreground text-xs">--</span>;
        },
      },
      {
        id: "sharpe",
        header: "Sharpe",
        accessorFn: (row) => row.metricsSnapshot.sharpe,
        cell: ({ row }) => <span className="font-mono text-sm">{fmtNum(row.original.metricsSnapshot.sharpe)}</span>,
      },
      {
        id: "return",
        header: "Return",
        accessorFn: (row) => row.metricsSnapshot.totalReturn,
        cell: ({ row }) => (
          <span className="font-mono text-sm">{fmtPct(row.original.metricsSnapshot.totalReturn)}</span>
        ),
      },
      {
        accessorKey: "selectedBy",
        header: "Selected By",
        enableSorting: false,
        cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.selectedBy}</span>,
      },
    ],

    [BACKTEST_RUNS, promotionTargets],
  );

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (candidatesIsError) {
    return (
      <div className="p-6">
        <ApiError error={candidatesError} onRetry={() => candidatesRefetch()} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="platform-page-width space-y-6 p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Promotion Pipeline</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {pendingCandidates.length} pending &middot; {resolvedCandidates.length} resolved
            </p>
          </div>
          <CandidateBasket
            platform="strategy"
            candidates={basket.candidates}
            onRemove={basket.removeCandidate}
            onClearAll={basket.clearAll}
            onUpdateNote={basket.updateNote}
            onSendToReview={() => {
              if (basket.candidates.length === 0) {
                toast.message("Add at least one candidate to the basket first.");
                return;
              }
              toast.success("Opening strategy handoff.");
              router.push("/services/research/strategy/handoff?source=candidates&action=review");
            }}
            onPreparePackage={() => {
              if (basket.candidates.length === 0) {
                toast.message("Add at least one candidate to the basket first.");
                return;
              }
              toast.success("Opening handoff to prepare your promotion package.");
              router.push("/services/research/strategy/handoff?source=candidates&action=package");
            }}
          />
        </div>

        {/* Pending Candidates */}
        {pendingCandidates.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Target className="size-5 text-amber-400" />
              Awaiting Review
            </h2>
            {pendingCandidates.map((candidate) => {
              const bt = BACKTEST_RUNS.find((b) => b.id === candidate.backtestRunId);
              const m = candidate.metricsSnapshot;
              const stageIdx = getWorkflowStageIndex(candidate);

              return (
                <Card key={candidate.id} className="border-border/50">
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {/* Top row: info + actions */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{bt?.templateName ?? candidate.configId}</span>
                            <Badge variant="outline" className={reviewStateColor(candidate.reviewState)}>
                              {candidate.reviewState.replace(/_/g, " ")}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-mono">v{candidate.configVersion}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{candidate.rationale}</p>
                          <p className="text-xs text-muted-foreground">
                            Selected by {candidate.selectedBy} on {new Date(candidate.selectedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setCommentDialog(candidate.id)}>
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
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 rounded-lg border border-border/30 p-3">
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
                          <p className="text-lg font-bold font-mono text-red-400">{fmtPct(m.maxDrawdown)}</p>
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
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Profit Factor</p>
                          <p className="text-lg font-bold font-mono">{fmtNum(m.profitFactor)}</p>
                        </div>
                      </div>

                      {/* Approval Workflow Visualization */}
                      <div className="flex items-center gap-2">
                        {WORKFLOW_STAGES.map((stage, idx) => {
                          const Icon = stage.icon;
                          const isActive = idx <= stageIdx;
                          const isCurrent = idx === stageIdx;
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
                          );
                        })}
                      </div>

                      {/* Review Comments */}
                      {candidate.reviewComments.length > 0 && (
                        <div className="space-y-2 border-t border-border/30 pt-3">
                          <p className="text-xs font-medium text-muted-foreground">Comments</p>
                          {candidate.reviewComments.map((rc) => (
                            <div key={rc.id} className="flex items-start gap-2 text-sm">
                              <div className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{rc.userName}</div>
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
              );
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
              <DataTable columns={resolvedColumns} data={resolvedCandidates} emptyMessage="No resolved candidates" />
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {candidates.length === 0 && (
          <EmptyState
            title="All strategies reviewed"
            description="No candidates in the pipeline. Add candidates from the Backtests page."
            icon={Target}
          />
        )}

        {/* Comment Dialog */}
        <Dialog
          open={commentDialog !== null}
          onOpenChange={(open) => {
            if (!open) {
              setCommentDialog(null);
              setCommentText("");
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Review Comment</DialogTitle>
              <DialogDescription>Add a comment to the candidate review.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Comment</Label>
              <Input
                placeholder="Enter your review comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && commentDialog) {
                    addComment(commentDialog);
                  }
                }}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setCommentDialog(null);
                  setCommentText("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={() => commentDialog && addComment(commentDialog)} disabled={!commentText.trim()}>
                <MessageSquare className="size-4" />
                Add Comment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
