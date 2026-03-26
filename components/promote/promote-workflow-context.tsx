"use client";

import * as React from "react";
import { STAGE_META } from "./stage-meta";
import type {
  PromotionStage,
  PromoteWorkflowAction,
  ReviewDecision,
  ReviewHistoryEntry,
} from "./types";

export type WorkflowPayload = {
  action: PromoteWorkflowAction;
  comment: string;
  riskAck?: boolean;
  /** Governance only: record approval without passing the governance stage (paper path). */
  governancePaperOnly?: boolean;
  /** Demote: move pipeline pointer back to this stage (must be before currentStage). */
  demoteToStage?: PromotionStage;
};

type RecordFn = (
  strategyId: string,
  stage: PromotionStage,
  payload: WorkflowPayload,
) => void;

const Ctx = React.createContext<RecordFn | null>(null);

export function PromoteWorkflowProvider({
  children,
  onRecord,
}: {
  children: React.ReactNode;
  onRecord: RecordFn;
}) {
  return <Ctx.Provider value={onRecord}>{children}</Ctx.Provider>;
}

export function useRecordPromoteWorkflow(): RecordFn | null {
  return React.useContext(Ctx);
}

export function workflowDecision(
  action: WorkflowPayload["action"],
): ReviewDecision {
  if (action === "reject") return "rejected";
  if (action === "retest" || action === "demote") return "requires_changes";
  return "approved";
}

export function buildReviewEntry(
  strategyId: string,
  stage: PromotionStage,
  payload: WorkflowPayload,
): ReviewHistoryEntry {
  const isOverride = payload.action === "override";
  const baseComment = payload.comment.trim();
  let commentOut =
    payload.action === "demote" && payload.demoteToStage
      ? `Demoted to ${STAGE_META[payload.demoteToStage].label}. ${baseComment}`
      : baseComment ||
        (payload.action === "approve" ? "Stage approved (demo)" : "");
  return {
    id: `wf-${strategyId}-${Date.now()}`,
    reviewer:
      payload.action === "demote"
        ? "Promotion committee (demo)"
        : isOverride
          ? "CIO / PM (override)"
          : "Reviewer (demo)",
    role:
      payload.action === "demote"
        ? "Committee"
        : isOverride
          ? "CIO"
          : "Promotion reviewer",
    decision: workflowDecision(payload.action),
    comment: commentOut,
    timestamp: new Date().toISOString(),
    stage,
    isOverride,
  };
}
