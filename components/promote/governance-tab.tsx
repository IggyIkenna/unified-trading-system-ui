"use client";

import * as React from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  History,
  Rocket,
  TestTube,
  Users,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ComplianceChecklist } from "./compliance-checklist";
import { ConfigDiffPanel } from "./config-diff-panel";
import { DeploymentPlanPanel } from "./deployment-plan-panel";
import { statusBg, StatusIcon } from "./helpers";
import { PromoteWorkflowActions } from "./promote-workflow-actions";
import { useRecordPromoteWorkflow } from "./promote-workflow-context";
import { STAGE_META } from "./stage-meta";
import type { CandidateStrategy } from "./types";
import { STAGE_ORDER } from "./types";

const REQUIRED_SIGNOFF_ROLES = [
  "Head of Quant Research",
  "Chief Risk Officer",
  "Head of Execution",
  "CIO / Portfolio Manager",
  "Compliance Officer",
] as const;

function latestApprovedForRole(
  history: CandidateStrategy["reviewHistory"],
  role: string,
): CandidateStrategy["reviewHistory"][0] | null {
  const hits = history.filter(
    (r) => r.role === role && r.decision === "approved",
  );
  if (hits.length === 0) return null;
  return (
    hits.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )[0] ?? null
  );
}

export function GovernanceTab({ strategy }: { strategy: CandidateStrategy }) {
  const record = useRecordPromoteWorkflow();
  const [acknowledgedRisks, setAcknowledgedRisks] = React.useState(false);
  const [liveAckFlash, setLiveAckFlash] = React.useState(false);
  const [paperAckFlash, setPaperAckFlash] = React.useState(false);
  const allStagesPassed = STAGE_ORDER.slice(0, -1).every(
    (stage) => strategy.stages[stage].status === "passed",
  );

  const requiredSignoffs = REQUIRED_SIGNOFF_ROLES.map((role) => {
    const hit = latestApprovedForRole(strategy.reviewHistory, role);
    return {
      role,
      name: hit?.reviewer ?? "Awaiting review",
      signed: hit !== null,
    };
  });

  const signedCount = requiredSignoffs.filter((s) => s.signed).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">
            Governance & Approval — {strategy.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            Committee sign-off, compliance review, and final deployment
            authorization
          </p>
        </div>
        <Badge
          variant="outline"
          className={statusBg(strategy.stages.governance.status)}
        >
          {strategy.stages.governance.status.replace("_", " ")}
        </Badge>
      </div>

      {!allStagesPassed && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="size-5 text-amber-400 shrink-0" />
          <div>
            <p className="text-sm font-medium">Prerequisites Incomplete</p>
            <p className="text-xs text-muted-foreground">
              All prior stages must pass before governance review can begin.
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="size-4" />
            Required Sign-offs ({signedCount}/{requiredSignoffs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {requiredSignoffs.map((signoff) => (
              <div
                key={signoff.role}
                className={cn(
                  "flex min-w-0 items-center justify-between gap-2 rounded-lg border p-3",
                  signoff.signed
                    ? "bg-emerald-500/10 border-emerald-500/20"
                    : "bg-muted/20 border-border/50",
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  {signoff.signed ? (
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                  ) : (
                    <Clock className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug">
                      {signoff.role}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {signoff.name}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "shrink-0",
                    signoff.signed
                      ? statusBg("passed")
                      : "text-muted-foreground",
                  )}
                >
                  {signoff.signed ? "Signed" : "Pending"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ComplianceChecklist strategy={strategy} />
      <ConfigDiffPanel strategy={strategy} />
      <DeploymentPlanPanel strategy={strategy} />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="size-4" />
            Review Audit Trail
          </CardTitle>
        </CardHeader>
        <CardContent>
          {strategy.reviewHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No reviews recorded yet
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {[...strategy.reviewHistory].reverse().map((review) => (
                <div
                  key={review.id}
                  className={cn(
                    "flex min-w-0 gap-3 rounded-lg border p-3",
                    review.isOverride
                      ? "border-amber-500/50 bg-amber-500/5"
                      : "border-border/50",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full",
                      review.decision === "approved"
                        ? "bg-emerald-500/15"
                        : review.decision === "rejected"
                          ? "bg-rose-500/15"
                          : "bg-amber-500/15",
                    )}
                  >
                    {review.decision === "approved" ? (
                      <CheckCircle2 className="size-4 text-emerald-400" />
                    ) : review.decision === "rejected" ? (
                      <XCircle className="size-4 text-rose-400" />
                    ) : (
                      <Clock className="size-4 text-amber-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-medium">
                        {review.reviewer}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {review.role}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          statusBg(
                            review.decision === "approved"
                              ? "passed"
                              : review.decision === "rejected"
                                ? "failed"
                                : "pending",
                          ),
                        )}
                      >
                        {review.decision}
                      </Badge>
                      {review.isOverride ? (
                        <Badge
                          variant="outline"
                          className="text-xs border-amber-500/50 text-amber-400"
                        >
                          Override
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {new Date(review.timestamp).toLocaleString()}
                    </p>
                    <p className="text-sm leading-snug text-muted-foreground">
                      {review.comment}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Stage: {STAGE_META[review.stage].label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {allStagesPassed && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="size-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-3 flex-1">
            <div>
              <p className="text-sm font-medium">
                Final Promotion Authorization
              </p>
              <p className="text-xs text-muted-foreground">
                Promoting {strategy.name} v{strategy.version} to live production
                will allocate real capital. This action requires{" "}
                {requiredSignoffs.length} sign-offs and cannot be undone without
                a formal wind-down process.
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={acknowledgedRisks}
                onCheckedChange={(v) => setAcknowledgedRisks(v === true)}
              />
              <span className="text-sm">
                I have reviewed all stages, understand the risks, and authorize
                live deployment
              </span>
            </label>
            <div className="flex gap-2 pt-1 flex-wrap">
              <Button
                disabled={
                  !acknowledgedRisks || signedCount < requiredSignoffs.length
                }
                className="gap-2"
                onClick={() => {
                  record?.(strategy.id, "governance", {
                    action: "approve",
                    comment: "Approved for live production",
                  });
                  setLiveAckFlash(true);
                  window.setTimeout(() => setLiveAckFlash(false), 2000);
                }}
              >
                {liveAckFlash ? (
                  <>
                    <Check className="size-4" />
                    Approved
                  </>
                ) : (
                  <>
                    <Rocket className="size-4" />
                    Approve for Live Trading
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="gap-2 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                disabled={!acknowledgedRisks}
                onClick={() => {
                  record?.(strategy.id, "governance", {
                    action: "approve",
                    comment: "Approved for paper trading only",
                    governancePaperOnly: true,
                  });
                  setPaperAckFlash(true);
                  window.setTimeout(() => setPaperAckFlash(false), 2000);
                }}
              >
                {paperAckFlash ? (
                  <>
                    <Check className="size-4" />
                    Recorded
                  </>
                ) : (
                  <>
                    <TestTube className="size-4" />
                    Approve for Paper Trading
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <PromoteWorkflowActions
        strategyId={strategy.id}
        strategyName={strategy.name}
        stage="governance"
        currentStage={strategy.currentStage}
      />
    </div>
  );
}
