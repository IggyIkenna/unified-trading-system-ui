"use client"

// Unified Batch Shell - the common layout wrapper for all batch workspaces
// Strategy Research, ML Training, Execution Analytics, and Deployment Readiness

import * as React from "react"
import { cn } from "@/lib/utils"
import { ContextBar, HierarchyScope, ContextBadgeData } from "./context-bar"
import { BatchLiveRail } from "./batch-live-rail"
import { FilterBar, FilterDefinition, useFilterState } from "./filter-bar"
import { CandidateBasket, CandidateItem, useCandidateBasket } from "./candidate-basket"
import { GlobalNavBar } from "@/components/trading/global-nav-bar"

interface UnifiedBatchShellProps {
  // Platform identity
  platform: "strategy" | "ml" | "execution"
  title: string
  subtitle?: string
  
  // Hierarchy
  scope: HierarchyScope
  onScopeChange?: (scope: HierarchyScope) => void
  
  // Context (batch/live)
  context: "BATCH" | "LIVE"
  onContextChange?: (context: "BATCH" | "LIVE") => void
  showBatchLiveRail?: boolean
  
  // Lifecycle
  currentStage?: string
  stageStatuses?: Record<string, "completed" | "current" | "pending" | "blocked">
  onStageClick?: (stage: string) => void
  
  // Context bar extras
  badges?: ContextBadgeData[]
  templateId?: string
  templateName?: string
  configId?: string
  configVersion?: string
  dataSource?: string
  asOfDate?: string
  
  // Filters
  filters?: FilterDefinition[]
  filterValues?: Record<string, unknown>
  onFilterChange?: (key: string, value: unknown) => void
  onFilterReset?: () => void
  showFilters?: boolean
  
  // Candidates
  candidates?: CandidateItem[]
  onCandidateRemove?: (id: string) => void
  onCandidateClearAll?: () => void
  onCandidateUpdateNote?: (id: string, note: string) => void
  onSendToReview?: () => void
  onPreparePackage?: () => void
  onOpenDeploymentReview?: () => void
  showCandidateBasket?: boolean
  
  // Layout
  children: React.ReactNode
  rightPanel?: React.ReactNode
  bottomPanel?: React.ReactNode
  showGlobalNav?: boolean
  
  className?: string
}

const platformMeta = {
  strategy: {
    color: "var(--surface-strategy)",
    defaultStage: "Backtest",
  },
  ml: {
    color: "var(--surface-ml)",
    defaultStage: "Train",
  },
  execution: {
    color: "hsl(200 70% 50%)",
    defaultStage: "Simulate",
  },
}

export function UnifiedBatchShell({
  platform,
  title,
  subtitle,
  scope,
  onScopeChange,
  context,
  onContextChange,
  showBatchLiveRail = true,
  currentStage,
  stageStatuses,
  onStageClick,
  badges,
  templateId,
  templateName,
  configId,
  configVersion,
  dataSource,
  asOfDate,
  filters,
  filterValues,
  onFilterChange,
  onFilterReset,
  showFilters = false,
  candidates = [],
  onCandidateRemove,
  onCandidateClearAll,
  onCandidateUpdateNote,
  onSendToReview,
  onPreparePackage,
  onOpenDeploymentReview,
  showCandidateBasket = true,
  children,
  rightPanel,
  bottomPanel,
  showGlobalNav = true,
  className,
}: UnifiedBatchShellProps) {
  const [filtersVisible, setFiltersVisible] = React.useState(showFilters)
  const meta = platformMeta[platform]

  return (
    <div className={cn("flex flex-col min-h-screen bg-background", className)}>
      {/* Global Navigation */}
      {showGlobalNav && <GlobalNavBar />}

      {/* Context Bar */}
      <ContextBar
        platform={platform}
        scope={scope}
        onScopeChange={onScopeChange}
        context={context}
        onContextChange={onContextChange}
        badges={badges}
        templateId={templateId}
        templateName={templateName}
        configId={configId}
        configVersion={configVersion}
        dataSource={dataSource}
        asOfDate={asOfDate}
        showFilters={!!filters}
        onFiltersToggle={() => setFiltersVisible((v) => !v)}
        filtersActive={filtersVisible}
        actions={
          showCandidateBasket && (
            <CandidateBasket
              platform={platform}
              candidates={candidates}
              onRemove={onCandidateRemove || (() => {})}
              onClearAll={onCandidateClearAll || (() => {})}
              onUpdateNote={onCandidateUpdateNote || (() => {})}
              onSendToReview={onSendToReview || (() => {})}
              onPreparePackage={onPreparePackage || (() => {})}
              onOpenDeploymentReview={onOpenDeploymentReview}
            />
          )
        }
      />

      {/* Batch/Live Rail with Lifecycle */}
      {showBatchLiveRail && (
        <BatchLiveRail
          platform={platform}
          currentStage={currentStage || meta.defaultStage}
          context={context}
          onContextChange={onContextChange}
          onStageClick={onStageClick}
          stageStatuses={stageStatuses}
          showToggle={!!onContextChange}
        />
      )}

      {/* Filter Bar */}
      {filtersVisible && filters && filterValues && onFilterChange && onFilterReset && (
        <FilterBar
          filters={filters}
          values={filterValues}
          onChange={onFilterChange}
          onReset={onFilterReset}
          persistToUrl
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Workspace */}
        <main className={cn("flex-1 overflow-auto", rightPanel && "border-r")}>
          {children}
        </main>

        {/* Right Panel (Detail Drawer) */}
        {rightPanel && (
          <aside className="w-[400px] border-l bg-card/50 overflow-auto">
            {rightPanel}
          </aside>
        )}
      </div>

      {/* Bottom Panel */}
      {bottomPanel && (
        <div className="border-t bg-card/50">
          {bottomPanel}
        </div>
      )}
    </div>
  )
}

// Export hook for managing batch shell state
export function useBatchShellState(
  initialPlatform: "strategy" | "ml" | "execution",
  initialScope: HierarchyScope = {},
  initialContext: "BATCH" | "LIVE" = "BATCH"
) {
  const [scope, setScope] = React.useState<HierarchyScope>(initialScope)
  const [context, setContext] = React.useState<"BATCH" | "LIVE">(initialContext)
  const [currentStage, setCurrentStage] = React.useState<string | undefined>()
  
  const candidateBasket = useCandidateBasket()

  return {
    scope,
    setScope,
    context,
    setContext,
    currentStage,
    setCurrentStage,
    ...candidateBasket,
  }
}
