/**
 * Batch Workspace — shared infrastructure for Strategy, ML, and Execution research.
 *
 * These components implement the unified research-family interaction grammar:
 * shortlist → compare → inspect → package → handoff.
 *
 * Every research-family page should compose from these building blocks,
 * NOT invent its own selection, comparison, or handoff patterns.
 */

export { BatchWorkspaceShell } from "./batch-workspace-shell";
export { ComparisonPanel } from "./comparison-panel";
export { BatchLiveCompare } from "./batch-live-compare";
export { DriftPanel } from "./drift-panel";
export { BatchDetailDrawer } from "./batch-detail-drawer";
export { BatchFilterBar } from "./batch-filter-bar";

// Re-export shared infrastructure from platform/
export { CandidateBasket, useCandidateBasket } from "@/components/platform/candidate-basket";
export type { CandidateItem } from "@/components/platform/candidate-basket";
export { BatchLiveRail, LifecycleRail, BatchLiveToggle } from "@/components/platform/batch-live-rail";
export { ResearchFamilyShell } from "@/components/platform/research-family-shell";
