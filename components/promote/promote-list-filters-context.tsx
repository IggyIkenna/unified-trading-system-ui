"use client";

import * as React from "react";
import { usePromoteLifecycleStore } from "@/lib/stores/promote-lifecycle-store";
import {
  DEFAULT_PAGE_SIZE,
  readPromoteListFiltersFromStorage,
  writePromoteListFiltersToStorage,
} from "./promote-list-filters-storage";
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
  /** Paginated slice for the left strategy list only. */
  paginatedList: CandidateStrategy[];
  listPage: number;
  setListPage: React.Dispatch<React.SetStateAction<number>>;
  listTotalPages: number;
  pageSize: number;
  setPageSize: (n: number) => void;
  /** Same filters as `filtered` but stage filter ignored — for stage counts. */
  cohortWithoutStageFilter: CandidateStrategy[];
  candidates: CandidateStrategy[];
  assetClasses: string[];
  archetypes: string[];
}

const PromoteListFiltersContext =
  React.createContext<PromoteListFiltersValue | null>(null);

const PAGE_SIZE_OPTIONS = [10, 15, 25, 50] as const;

function normalizePageSize(n: number): number {
  return PAGE_SIZE_OPTIONS.includes(n as (typeof PAGE_SIZE_OPTIONS)[number])
    ? n
    : DEFAULT_PAGE_SIZE;
}

export function PromoteListFiltersProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const candidates = usePromoteLifecycleStore((s) => s.candidates);
  const stored = readPromoteListFiltersFromStorage();

  const [asset, setAsset] = React.useState<string>(() => stored.asset ?? "all");
  const [archetype, setArchetype] = React.useState<string>(
    () => stored.archetype ?? "all",
  );
  const [stageFilter, setStageFilter] = React.useState<string>(
    () => stored.stageFilter ?? "all",
  );
  const [submitterQ, setSubmitterQ] = React.useState(
    () => stored.submitterQ ?? "",
  );
  const [submittedFrom, setSubmittedFrom] = React.useState(
    () => stored.submittedFrom ?? "",
  );
  const [submittedTo, setSubmittedTo] = React.useState(
    () => stored.submittedTo ?? "",
  );
  const [listPage, setListPage] = React.useState(() =>
    Math.max(1, Number(stored.listPage) || 1),
  );
  const [pageSize, setPageSizeState] = React.useState(() =>
    normalizePageSize(Number(stored.pageSize) || DEFAULT_PAGE_SIZE),
  );

  const setPageSize = React.useCallback((n: number) => {
    setPageSizeState(normalizePageSize(n));
  }, []);

  const pageSizeRef = React.useRef(pageSize);
  React.useEffect(() => {
    if (pageSizeRef.current !== pageSize) {
      pageSizeRef.current = pageSize;
      setListPage(1);
    }
  }, [pageSize]);

  const filterSignature = React.useMemo(
    () =>
      [
        asset,
        archetype,
        stageFilter,
        submitterQ,
        submittedFrom,
        submittedTo,
      ].join("\0"),
    [asset, archetype, stageFilter, submitterQ, submittedFrom, submittedTo],
  );
  const prevFilterSig = React.useRef(filterSignature);
  React.useEffect(() => {
    if (prevFilterSig.current !== filterSignature) {
      prevFilterSig.current = filterSignature;
      setListPage(1);
    }
  }, [filterSignature]);

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

  const listTotalPages = Math.max(
    1,
    Math.ceil(filtered.length / pageSize) || 1,
  );

  React.useEffect(() => {
    if (listPage > listTotalPages) {
      setListPage(listTotalPages);
    }
  }, [listPage, listTotalPages]);

  const paginatedList = React.useMemo(() => {
    const safePage = Math.min(listPage, listTotalPages);
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, listPage, listTotalPages, pageSize]);

  React.useEffect(() => {
    writePromoteListFiltersToStorage({
      stageFilter,
      asset,
      archetype,
      submitterQ,
      submittedFrom,
      submittedTo,
      listPage: Math.min(listPage, listTotalPages),
      pageSize,
    });
  }, [
    stageFilter,
    asset,
    archetype,
    submitterQ,
    submittedFrom,
    submittedTo,
    listPage,
    listTotalPages,
    pageSize,
  ]);

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
      paginatedList,
      listPage,
      setListPage,
      listTotalPages,
      pageSize,
      setPageSize,
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
      paginatedList,
      listPage,
      listTotalPages,
      pageSize,
      setPageSize,
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
