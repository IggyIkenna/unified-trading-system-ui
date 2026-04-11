"use client";

/**
 * BatchWorkspaceShell — the canonical page template for research-family pages.
 *
 * Composes: header → context bar → batch/live rail → filter bar → main content
 * with optional candidate basket and detail drawer.
 *
 * Strategy, ML, and Execution research pages should all wrap their content
 * in this shell to ensure consistent layout and interaction patterns.
 */

import * as React from "react";
import { ResearchFamilyShell, type ResearchPlatform } from "@/components/platform/research-family-shell";
import { DataFreshnessStrip, type DataSource } from "@/components/shared/data-freshness-strip";
import { BatchFilterBar, type FilterConfig } from "./batch-filter-bar";
import { CandidateBasket, useCandidateBasket, type CandidateItem } from "@/components/platform/candidate-basket";
import { cn } from "@/lib/utils";

interface BatchWorkspaceShellProps {
  /** Which research platform: strategy, ml, or execution */
  platform: ResearchPlatform;
  /** Page title shown in the workspace header */
  title: string;
  /** Optional subtitle / description */
  description?: string;
  /** Tab navigation (platform-specific tabs) */
  tabs: React.ReactNode;
  /** Filter configuration for the filter bar */
  filters?: FilterConfig[];
  /** Callback when filters change */
  onFilterChange?: (filters: Record<string, string>) => void;
  /** Whether to show the batch/live rail */
  showBatchLiveRail?: boolean;
  /** Whether to show the candidate basket */
  showCandidateBasket?: boolean;
  /** Pre-loaded candidates for the basket */
  initialCandidates?: CandidateItem[];
  /** Data freshness sources for the provenance strip */
  dataSources?: DataSource[];
  /** Actions slot (right side of header) */
  actions?: React.ReactNode;
  /** Main content */
  children: React.ReactNode;
  className?: string;
}

export function BatchWorkspaceShell({
  platform,
  title,
  description,
  tabs,
  filters,
  onFilterChange,
  showBatchLiveRail = true,
  showCandidateBasket = true,
  initialCandidates,
  dataSources,
  actions,
  children,
  className,
}: BatchWorkspaceShellProps) {
  const basket = useCandidateBasket(initialCandidates);

  return (
    <ResearchFamilyShell
      platform={platform}
      tabs={tabs}
      showBatchLiveRail={showBatchLiveRail}
    >
      {/* Workspace header */}
      <div className="flex items-start justify-between gap-4 px-6 pt-4 pb-2">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {actions}
          {showCandidateBasket && (
            <CandidateBasket
              platform={platform}
              candidates={basket.candidates}
              onRemove={basket.removeCandidate}
              onClearAll={basket.clearAll}
              onUpdateNote={basket.updateNote}
              onSendToReview={() => {
                // Navigate to promote/review — wired per-page
              }}
              onPreparePackage={() => {
                // Open package builder — wired per-page
              }}
            />
          )}
        </div>
      </div>

      {/* Data freshness strip */}
      {dataSources && dataSources.length > 0 && (
        <DataFreshnessStrip sources={dataSources} className="px-6 py-1" />
      )}

      {/* Filter bar */}
      {filters && filters.length > 0 && (
        <BatchFilterBar
          filters={filters}
          onChange={onFilterChange}
          className="px-6 pb-2"
        />
      )}

      {/* Main content area */}
      <div className={cn("flex-1 px-6 pb-6", className)}>
        {children}
      </div>
    </ResearchFamilyShell>
  );
}
