"use client";

import * as React from "react";
import { STAGE_META } from "./stage-meta";
import type { PromotionStage, PromoteWorkflowAction, ReviewDecision, ReviewHistoryEntry } from "./types";
import { promoteCandidate, type PromoteTargetPhase } from "@/lib/api/promote-client";

export type WorkflowPayload = {
  action: PromoteWorkflowAction;
  comment: string;
  riskAck?: boolean;
  /** Governance only: record approval without passing the governance stage (paper path). */
  governancePaperOnly?: boolean;
  /** Demote: move pipeline pointer back to this stage (must be before currentStage). */
  demoteToStage?: PromotionStage;
  /** Manifest ID for backend promote calls (paper_1d / live_early actions). */
  manifestId?: string;
  /** Target phase for backend promote calls. */
  targetPhase?: PromoteTargetPhase;
};

type RecordFn = (strategyId: string, stage: PromotionStage, payload: WorkflowPayload) => void;

const Ctx = React.createContext<RecordFn | null>(null);

/** Backend token context — injected by auth provider. */
const TokenCtx = React.createContext<string | null>(null);

export function PromoteWorkflowProvider({
  children,
  onRecord,
  token,
}: {
  children: React.ReactNode;
  onRecord: RecordFn;
  token?: string | null;
}) {
  return (
    <TokenCtx.Provider value={token ?? null}>
      <Ctx.Provider value={onRecord}>{children}</Ctx.Provider>
    </TokenCtx.Provider>
  );
}

export function useRecordPromoteWorkflow(): RecordFn | null {
  return React.useContext(Ctx);
}

/**
 * Returns an async function that POSTs to the backend promote endpoint
 * (Phase U3) and then calls the local record function for optimistic UI.
 *
 * If the backend call fails, the local state is not updated (error is re-thrown).
 */
export function useBackendPromoteWorkflow(): (
  strategyId: string,
  manifestId: string,
  targetPhase: PromoteTargetPhase,
  promoter: string,
  reason: string,
) => Promise<void> {
  const token = React.useContext(TokenCtx);
  return React.useCallback(
    async (strategyId, manifestId, targetPhase, promoter, reason) => {
      await promoteCandidate(strategyId, manifestId, { target_phase: targetPhase, promoter, reason }, token);
    },
    [token],
  );
}

export function workflowDecision(action: WorkflowPayload["action"]): ReviewDecision {
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
      : baseComment || (payload.action === "approve" ? "Stage approved (demo)" : "");
  return {
    id: `wf-${strategyId}-${Date.now()}`,
    reviewer:
      payload.action === "demote"
        ? "Promotion committee (demo)"
        : isOverride
          ? "CIO / PM (override)"
          : "Reviewer (demo)",
    role: payload.action === "demote" ? "Committee" : isOverride ? "CIO" : "Promotion reviewer",
    decision: workflowDecision(payload.action),
    comment: commentOut,
    timestamp: new Date().toISOString(),
    stage,
    isOverride,
  };
}
