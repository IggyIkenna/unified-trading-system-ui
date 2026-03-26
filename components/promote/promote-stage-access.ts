import type { CandidateStrategy, PromotionStage } from "./types";
import { STAGE_ORDER } from "./types";

export function promoteStageIndex(stage: PromotionStage): number {
  return STAGE_ORDER.indexOf(stage);
}

/** True when the user must not open this official stage yet (pipeline pointer has not reached it). */
export function isPromoteStageLocked(
  selected: CandidateStrategy | null,
  stage: PromotionStage,
): boolean {
  if (!selected) return true;
  const cur = promoteStageIndex(selected.currentStage);
  const tgt = promoteStageIndex(stage);
  return tgt > cur;
}
