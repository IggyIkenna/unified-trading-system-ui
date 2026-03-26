"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
  StepBack,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { PromotionStage, PromoteWorkflowAction } from "./types";
import { STAGE_ORDER } from "./types";
import { STAGE_META } from "./stage-meta";
import {
  useRecordPromoteWorkflow,
  type WorkflowPayload,
} from "./promote-workflow-context";

export function PromoteWorkflowActions({
  strategyId,
  strategyName,
  stage,
  currentStage,
  onAction,
}: {
  strategyId: string;
  strategyName: string;
  /** Stage this tab represents (fixed per tab). */
  stage: PromotionStage;
  /** Pipeline pointer — approve/reject/retest/override only apply when stage === currentStage. */
  currentStage: PromotionStage;
  onAction?: (payload: WorkflowPayload) => void;
}) {
  const record = useRecordPromoteWorkflow();
  const [open, setOpen] = React.useState(false);
  const [demoteOpen, setDemoteOpen] = React.useState(false);
  const [actionType, setActionType] =
    React.useState<PromoteWorkflowAction>("approve");
  const [comment, setComment] = React.useState("");
  const [riskAck, setRiskAck] = React.useState(false);
  const [demoteTarget, setDemoteTarget] =
    React.useState<PromotionStage>("data_validation");
  const [demoteComment, setDemoteComment] = React.useState("");

  const tabMatchesPipeline = stage === currentStage;
  const curIdx = STAGE_ORDER.indexOf(currentStage);
  const demoteOptions = curIdx > 0 ? STAGE_ORDER.slice(0, curIdx) : [];

  const openDialog = (t: PromoteWorkflowAction) => {
    setActionType(t);
    setComment("");
    setRiskAck(false);
    setOpen(true);
  };

  const openDemote = () => {
    const prev = curIdx > 0 ? STAGE_ORDER[curIdx - 1]! : "data_validation";
    setDemoteTarget(prev);
    setDemoteComment("");
    setDemoteOpen(true);
  };

  const submit = () => {
    const payload = {
      action: actionType,
      comment,
      riskAck: actionType === "override" ? riskAck : undefined,
    };
    onAction?.(payload);
    record?.(strategyId, stage, payload);
    setOpen(false);
  };

  const submitDemote = () => {
    const payload: WorkflowPayload = {
      action: "demote",
      comment: demoteComment,
      demoteToStage: demoteTarget,
    };
    onAction?.(payload);
    record?.(strategyId, currentStage, payload);
    setDemoteOpen(false);
  };

  const commentRequired = actionType === "reject" || actionType === "override";
  const valid =
    (!commentRequired || comment.trim().length > 0) &&
    (actionType !== "override" || riskAck);
  const demoteValid = demoteComment.trim().length > 0;

  return (
    <div className="space-y-3 pt-4 border-t border-border/60 mt-4">
      {!tabMatchesPipeline && (
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Approve, reject, retest, and override apply only on the{" "}
          <span className="font-medium text-foreground">
            {STAGE_META[currentStage].label}
          </span>{" "}
          tab (current pipeline stage). Use{" "}
          <span className="font-medium text-foreground">Demote</span> to move
          backward.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
          disabled={!tabMatchesPipeline}
          onClick={() => openDialog("approve")}
        >
          <CheckCircle2 className="size-3.5" />
          Approve Stage
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 border-rose-500/40 text-rose-400"
          disabled={!tabMatchesPipeline}
          onClick={() => openDialog("reject")}
        >
          <XCircle className="size-3.5" />
          Reject
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 border-cyan-500/40 text-cyan-400"
          disabled={!tabMatchesPipeline}
          onClick={() => openDialog("retest")}
        >
          <RefreshCw className="size-3.5" />
          Request Retest
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 border-amber-500/50 text-amber-400"
          disabled={!tabMatchesPipeline}
          onClick={() => openDialog("override")}
        >
          <ShieldAlert className="size-3.5" />
          Override
        </Button>
        {demoteOptions.length > 0 ? (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 border-slate-500/40 text-slate-300"
            onClick={openDemote}
          >
            <StepBack className="size-3.5" />
            Demote
          </Button>
        ) : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              {actionType === "approve" && (
                <CheckCircle2 className="size-4 text-emerald-400" />
              )}
              {actionType === "reject" && (
                <XCircle className="size-4 text-rose-400" />
              )}
              {actionType === "retest" && (
                <RefreshCw className="size-4 text-cyan-400" />
              )}
              {actionType === "override" && (
                <AlertTriangle className="size-4 text-amber-400" />
              )}
              Confirm{" "}
              {actionType === "approve"
                ? "approval"
                : actionType === "reject"
                  ? "rejection"
                  : actionType === "retest"
                    ? "retest"
                    : "override"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">
                {strategyName}
              </span>
              <span className="mx-1">·</span>
              {STAGE_META[stage].label}
            </p>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide">
                Comment
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  commentRequired
                    ? "Required for this action"
                    : "Optional note for audit trail"
                }
                className="mt-1 font-mono text-xs min-h-[88px]"
              />
            </div>
            {actionType === "override" && (
              <label className="flex items-start gap-2 cursor-pointer">
                <Checkbox
                  checked={riskAck}
                  onCheckedChange={(v) => setRiskAck(v === true)}
                  className="mt-0.5"
                />
                <span className="text-xs leading-snug">
                  I acknowledge elevated risk and that this override will be
                  flagged in the audit trail.
                </span>
              </label>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" disabled={!valid} onClick={submit}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={demoteOpen} onOpenChange={setDemoteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <StepBack className="size-4 text-slate-400" />
              Demote pipeline
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">
                {strategyName}
              </span>
              <span className="mx-1">·</span>
              Currently at{" "}
              <span className="font-mono text-foreground">
                {STAGE_META[currentStage].label}
              </span>
            </p>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide">
                Move back to
              </label>
              <select
                className="mt-1 flex h-9 w-full rounded-md border border-border bg-background px-2 text-xs font-mono"
                value={demoteTarget}
                onChange={(e) =>
                  setDemoteTarget(e.target.value as PromotionStage)
                }
                aria-label="Demote target stage"
              >
                {demoteOptions.map((s) => (
                  <option key={s} value={s}>
                    {STAGE_META[s].label}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              The target stage reopens as pending; all later stages reset to not
              started. Earlier passed stages are left unchanged for audit
              context.
            </p>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide">
                Reason (required)
              </label>
              <Textarea
                value={demoteComment}
                onChange={(e) => setDemoteComment(e.target.value)}
                placeholder="Why is this candidate being sent back?"
                className="mt-1 font-mono text-xs min-h-[88px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDemoteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-slate-500/40"
              disabled={!demoteValid}
              onClick={submitDemote}
            >
              Confirm demote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
