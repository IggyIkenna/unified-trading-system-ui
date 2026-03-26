import {
  buildReviewEntry,
  type WorkflowPayload,
} from "./promote-workflow-context";
import type { CandidateStrategy, GateStatus, PromotionStage } from "./types";
import { STAGE_ORDER } from "./types";

function cloneStages(
  stages: CandidateStrategy["stages"],
): CandidateStrategy["stages"] {
  const out = {} as CandidateStrategy["stages"];
  for (const k of STAGE_ORDER) {
    out[k] = { ...stages[k] };
  }
  return out;
}

/** Apply workflow action: audit entry + stage / currentStage mutations (demo). */
export function applyPromoteWorkflowRecord(
  strategy: CandidateStrategy,
  stage: PromotionStage,
  payload: WorkflowPayload,
): CandidateStrategy {
  if (payload.action === "demote") {
    const target = payload.demoteToStage;
    if (!target || payload.comment.trim().length === 0) return strategy;
    const targetIdx = STAGE_ORDER.indexOf(target);
    const curIdx = STAGE_ORDER.indexOf(strategy.currentStage);
    if (targetIdx < 0 || curIdx < 0 || targetIdx >= curIdx) return strategy;

    const entry = buildReviewEntry(strategy.id, strategy.currentStage, payload);
    const reviewHistory = [...strategy.reviewHistory, entry];
    const stages = cloneStages(strategy.stages);

    for (let i = 0; i < STAGE_ORDER.length; i++) {
      const s = STAGE_ORDER[i]!;
      if (i < targetIdx) continue;
      if (i === targetIdx) {
        stages[s] = {
          ...stages[s],
          status: "pending" as GateStatus,
          completedAt: undefined,
        };
        continue;
      }
      stages[s] = {
        ...stages[s],
        status: "not_started" as GateStatus,
        completedAt: undefined,
      };
    }

    return { ...strategy, currentStage: target, stages, reviewHistory };
  }

  const cur = stage;
  const stageMatchesCurrent = cur === strategy.currentStage;

  if (payload.action === "reject") {
    if (!stageMatchesCurrent) return strategy;
    const entry = buildReviewEntry(strategy.id, stage, payload);
    const reviewHistory = [...strategy.reviewHistory, entry];
    const stages = cloneStages(strategy.stages);
    stages[cur] = { ...stages[cur], status: "failed" as GateStatus };
    return { ...strategy, stages, reviewHistory };
  }

  if (payload.action === "retest") {
    if (!stageMatchesCurrent) return strategy;
    const entry = buildReviewEntry(strategy.id, stage, payload);
    const reviewHistory = [...strategy.reviewHistory, entry];
    const stages = cloneStages(strategy.stages);
    stages[cur] = {
      ...stages[cur],
      status: "pending" as GateStatus,
      completedAt: undefined,
    };
    return { ...strategy, stages, reviewHistory };
  }

  if (payload.action === "approve" || payload.action === "override") {
    if (payload.governancePaperOnly) {
      const entry = buildReviewEntry(strategy.id, stage, payload);
      return { ...strategy, reviewHistory: [...strategy.reviewHistory, entry] };
    }

    if (!stageMatchesCurrent) return strategy;

    const entry = buildReviewEntry(strategy.id, stage, payload);
    const reviewHistory = [...strategy.reviewHistory, entry];
    const stages = cloneStages(strategy.stages);

    stages[cur] = {
      ...stages[cur],
      status: "passed" as GateStatus,
      completedAt: new Date().toISOString(),
    };

    const idx = STAGE_ORDER.indexOf(cur);
    const nextIdx = idx + 1;
    let currentStage = strategy.currentStage;

    if (nextIdx < STAGE_ORDER.length) {
      const nxt = STAGE_ORDER[nextIdx]!;
      stages[nxt] = { ...stages[nxt] };
      if (stages[nxt].status === "not_started") {
        stages[nxt] = { ...stages[nxt], status: "pending" as GateStatus };
      }
      currentStage = nxt;
    }

    return { ...strategy, stages, currentStage, reviewHistory };
  }

  return strategy;
}
