"use client";

import * as React from "react";
import { usePromoteLifecycleStore } from "@/lib/stores/promote-lifecycle-store";
import type { CandidateStrategy } from "./types";

export interface PromoteListFiltersValue {
  asset: string;
  setAsset: (v: string) => void;
  archetype: string;
  setArchetype: (v: string) => void;
  stageFilter: string;
  setStageFilter: (v: string) => void;
  submitterQ: string;
  setSubmitterQ: (v: string) => void;
  submittedFrom: string;
  setSubmittedFrom: (v: string) => void;
  submittedTo: string;
  setSubmittedTo: (v: string) => void;
  filtered: CandidateStrategy[];
  /** Same filters as `filtered` but stage filter ignored — for chip counts. */
  cohortWithoutStageFilter: CandidateStrategy[];
  candidates: CandidateStrategy[];
  assetClasses: string[];
  archetypes: string[];
}

const PromoteListFiltersContext =
  React.createContext<PromoteListFiltersValue | null>(null);

export function PromoteListFiltersProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const candidates = usePromoteLifecycleStore((s) => s.candidates);
  const [asset, setAsset] = React.useState<string>("all");
  const [archetype, setArchetype] = React.useState<string>("all");
  const [stageFilter, setStageFilter] = React.useState<string>("all");
  const [submitterQ, setSubmitterQ] = React.useState("");
  const [submittedFrom, setSubmittedFrom] = React.useState("");
  const [submittedTo, setSubmittedTo] = React.useState("");

  const assetClasses = React.useMemo(
    () => ["all", ...new Set(candidates.map((c) => c.assetClass))],
    [candidates],
  );
  const archetypes = React.useMemo(
    () => ["all", ...new Set(candidates.map((c) => c.archetype))].sort(),
    [candidates],
  );

  const cohortWithoutStageFilter = React.useMemo(() => {
    const fromMs = submittedFrom ? new Date(submittedFrom).getTime() : null;
    const toMs = submittedTo
      ? new Date(submittedTo).getTime() + 86_400_000 - 1
      : null;
    return candidates.filter((c) => {
      if (asset !== "all" && c.assetClass !== asset) return false;
      if (archetype !== "all" && c.archetype !== archetype) return false;
      if (
        submitterQ.trim() &&
        !c.submittedBy.toLowerCase().includes(submitterQ.trim().toLowerCase())
      )
        return false;
      const sub = new Date(c.submittedAt).getTime();
      if (fromMs !== null && !Number.isNaN(fromMs) && sub < fromMs)
        return false;
      if (toMs !== null && !Number.isNaN(toMs) && sub > toMs) return false;
      return true;
    });
  }, [candidates, asset, archetype, submitterQ, submittedFrom, submittedTo]);

  const filtered = React.useMemo(() => {
    if (stageFilter === "all") return cohortWithoutStageFilter;
    return cohortWithoutStageFilter.filter(
      (c) => c.currentStage === stageFilter,
    );
  }, [cohortWithoutStageFilter, stageFilter]);

  const value = React.useMemo(
    () => ({
      asset,
      setAsset,
      archetype,
      setArchetype,
      stageFilter,
      setStageFilter,
      submitterQ,
      setSubmitterQ,
      submittedFrom,
      setSubmittedFrom,
      submittedTo,
      setSubmittedTo,
      filtered,
      cohortWithoutStageFilter,
      candidates,
      assetClasses,
      archetypes,
    }),
    [
      asset,
      archetype,
      stageFilter,
      submitterQ,
      submittedFrom,
      submittedTo,
      filtered,
      cohortWithoutStageFilter,
      candidates,
      assetClasses,
      archetypes,
    ],
  );

  return (
    <PromoteListFiltersContext.Provider value={value}>
      {children}
    </PromoteListFiltersContext.Provider>
  );
}

export function usePromoteListFilters(): PromoteListFiltersValue {
  const ctx = React.useContext(PromoteListFiltersContext);
  if (!ctx) {
    throw new Error(
      "usePromoteListFilters must be used within PromoteListFiltersProvider",
    );
  }
  return ctx;
}
