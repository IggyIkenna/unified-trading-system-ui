import { create } from "zustand";
import { MOCK_CANDIDATES } from "@/components/promote/mock-data";
import { applyPromoteWorkflowRecord } from "@/components/promote/promote-workflow-mutate";
import type { WorkflowPayload } from "@/components/promote/promote-workflow-context";
import type {
  CandidateStrategy,
  PromotionStage,
} from "@/components/promote/types";

function cloneInitialCandidates(): CandidateStrategy[] {
  /** Deep clone without `structuredClone` so Jest/jsdom can import this module. */
  return JSON.parse(JSON.stringify(MOCK_CANDIDATES)) as CandidateStrategy[];
}

export interface PromoteLifecycleState {
  candidates: CandidateStrategy[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  recordWorkflow: (
    strategyId: string,
    stage: PromotionStage,
    payload: WorkflowPayload,
  ) => void;
  reset: () => void;
}

export const usePromoteLifecycleStore = create<PromoteLifecycleState>(
  (set) => ({
    candidates: cloneInitialCandidates(),
    selectedId: null,
    setSelectedId: (id) => set({ selectedId: id }),
    recordWorkflow: (strategyId, stage, payload) =>
      set((s) => ({
        candidates: s.candidates.map((c) =>
          c.id === strategyId
            ? applyPromoteWorkflowRecord(c, stage, payload)
            : c,
        ),
      })),
    reset: () =>
      set({
        candidates: cloneInitialCandidates(),
        selectedId: null,
      }),
  }),
);

export function selectPromoteSelectedStrategy(
  state: PromoteLifecycleState,
): CandidateStrategy | null {
  if (!state.selectedId) return null;
  return state.candidates.find((c) => c.id === state.selectedId) ?? null;
}
