"use client";

/**
 * DartScopeBar — the persistent control plane for DART cockpit scope.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan.md §6 + Phase 2 of §17.
 *
 * Mounts on every cockpit-tier surface: Dashboard, Terminal, Research,
 * Strategy Catalogue, Reports, Signals. Compact by default (a one-line
 * sentence summary); clicking expands to chip controls for every
 * `WorkspaceScope` axis the user can tune.
 *
 * Acceptance (§17 Phase 2):
 *   - Compact mode answers "what am I looking at?" in one line.
 *   - Expanded mode lets the user answer "how do I change it?" in ≤1 click
 *     for each axis.
 *   - The Engagement toggle is reachable in ≤1 click on every cockpit
 *     surface that supports it.
 *   - The Live (executionStream) option is reachably-disabled (visible but
 *     not clickable, with tooltip) for personas without `execution-full`
 *     entitlement — the §4.3 safety contract enforced at the call-site.
 *
 * Phase 2 scope: ship the bar with all primary chips wired through to
 * `useWorkspaceScope` / `useWorkspaceScopeStore`. Preset-driven gating
 * (e.g. hide Engagement toggle when active preset's `supportsEngagement`
 * is monitor-only) lands in Phase 6 with the preset registry; for now the
 * toggle is unconditionally visible.
 */

import * as React from "react";
import { ChevronDown, Filter, Info, Lock, RotateCcw, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import {
  type ResearchStage,
  type TerminalMode,
  type WorkspaceEngagement,
  type WorkspaceExecutionStream,
  type WorkspaceScope,
  type WorkspaceSurface,
} from "@/lib/architecture-v2/workspace-scope";
import { useWorkspaceScope, useWorkspaceScopeStore } from "@/lib/stores/workspace-scope-store";
import { cn } from "@/lib/utils";

import { compactScopeSegments } from "./dart-scope-bar-summary";

// ─────────────────────────────────────────────────────────────────────────────
// Surface / mode / stage / engagement / stream option lists
// ─────────────────────────────────────────────────────────────────────────────

const SURFACE_OPTIONS: ReadonlyArray<{ readonly value: WorkspaceSurface; readonly label: string }> = [
  { value: "dashboard", label: "Dashboard" },
  { value: "terminal", label: "Terminal" },
  { value: "research", label: "Research" },
  { value: "reports", label: "Reports" },
  { value: "signals", label: "Signals" },
  { value: "ops", label: "Ops" },
];

const TERMINAL_MODE_OPTIONS: ReadonlyArray<{ readonly value: TerminalMode; readonly label: string }> = [
  { value: "command", label: "Command" },
  { value: "markets", label: "Markets" },
  { value: "strategies", label: "Strategies" },
  { value: "explain", label: "Explain" },
  { value: "ops", label: "Ops" },
];

const RESEARCH_STAGE_OPTIONS: ReadonlyArray<{ readonly value: ResearchStage; readonly label: string }> = [
  { value: "discover", label: "Discover" },
  { value: "build", label: "Build" },
  { value: "train", label: "Train" },
  { value: "validate", label: "Validate" },
  { value: "allocate", label: "Allocate" },
  { value: "promote", label: "Promote" },
];

const ENGAGEMENT_OPTIONS: ReadonlyArray<{ readonly value: WorkspaceEngagement; readonly label: string }> = [
  { value: "monitor", label: "Monitor" },
  { value: "replicate", label: "Replicate" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

interface SegmentedToggleProps<T extends string> {
  readonly testIdPrefix: string;
  readonly label: string;
  readonly value: T;
  readonly options: ReadonlyArray<{ readonly value: T; readonly label: string; readonly disabled?: boolean; readonly disabledReason?: string }>;
  readonly onChange: (next: T) => void;
}

function SegmentedToggle<T extends string>({
  testIdPrefix,
  label,
  value,
  options,
  onChange,
}: SegmentedToggleProps<T>) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex items-center rounded-md border border-border/60 bg-muted/20 p-0.5">
        {options.map((opt) => {
          const isActive = opt.value === value;
          const isDisabled = opt.disabled === true;
          const button = (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-disabled={isDisabled}
              onClick={() => {
                if (isDisabled) return;
                onChange(opt.value);
              }}
              data-testid={`${testIdPrefix}-${opt.value}`}
              className={cn(
                "px-2.5 py-1 text-xs rounded-sm transition-colors",
                isActive && !isDisabled && "bg-primary/15 text-primary font-medium",
                !isActive && !isDisabled && "text-muted-foreground hover:text-foreground hover:bg-secondary/40",
                isDisabled && "cursor-not-allowed text-muted-foreground/40",
              )}
            >
              <span className="inline-flex items-center gap-1">
                {isDisabled ? <Lock className="size-2.5" aria-hidden /> : null}
                {opt.label}
              </span>
            </button>
          );
          if (isDisabled && opt.disabledReason) {
            return (
              <Tooltip key={opt.value}>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent className="text-xs">{opt.disabledReason}</TooltipContent>
              </Tooltip>
            );
          }
          return button;
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// §4.3 Live confirm dialog
// ─────────────────────────────────────────────────────────────────────────────

interface LiveConfirmDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onConfirm: () => void;
}

function LiveConfirmDialog({ open, onOpenChange, onConfirm }: LiveConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="execution-stream-live-confirm">
        <DialogHeader>
          <DialogTitle>Switch to live execution?</DialogTitle>
          <DialogDescription className="text-sm">
            You are switching to live execution. Manual orders placed from now on route to real venues. Confirm?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <DialogClose asChild>
            <Button variant="outline" size="sm" data-testid="execution-stream-live-cancel">
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            data-testid="execution-stream-live-confirm-button"
          >
            Confirm — go Live
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Compact summary chip row
// ─────────────────────────────────────────────────────────────────────────────

function CompactSummary({ scope, expanded, onToggle }: { readonly scope: WorkspaceScope; readonly expanded: boolean; readonly onToggle: () => void }) {
  const segments = compactScopeSegments(scope);
  const isLive = scope.executionStream === "live";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-controls="dart-scope-bar-body"
      className="flex flex-wrap items-center gap-2 px-2 py-1 rounded-md hover:bg-secondary/50 text-left"
      data-testid="dart-scope-bar-toggle"
    >
      <Filter className="size-3.5 text-muted-foreground" aria-hidden />
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Scope</span>
      {segments.map((seg, i) => (
        <React.Fragment key={`${seg}-${i}`}>
          {i > 0 ? <span className="text-muted-foreground/30 text-xs" aria-hidden>·</span> : null}
          <span
            className={cn(
              "text-xs",
              i === segments.length - 1 && isLive
                ? "font-medium text-rose-500 inline-flex items-center gap-1"
                : "text-foreground",
            )}
          >
            {i === segments.length - 1 && isLive ? <span aria-hidden className="size-1.5 rounded-full bg-rose-500" /> : null}
            {seg}
          </span>
        </React.Fragment>
      ))}
      <ChevronDown className={cn("size-3 transition-transform text-muted-foreground", expanded && "rotate-180")} aria-hidden />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Top-level
// ─────────────────────────────────────────────────────────────────────────────

export interface DartScopeBarProps {
  readonly className?: string;
  /**
   * Render the bar in always-expanded mode (skips the click-to-expand
   * affordance). Used by surfaces where the bar is the page's primary
   * control surface (e.g. /services/research/strategies in Phase 4).
   */
  readonly defaultExpanded?: boolean;
}

export function DartScopeBar({ className, defaultExpanded = false }: DartScopeBarProps) {
  const scope = useWorkspaceScope();
  const setSurface = useWorkspaceScopeStore((s) => s.setSurface);
  const setTerminalMode = useWorkspaceScopeStore((s) => s.setTerminalMode);
  const setResearchStage = useWorkspaceScopeStore((s) => s.setResearchStage);
  const setEngagement = useWorkspaceScopeStore((s) => s.setEngagement);
  const setExecutionStream = useWorkspaceScopeStore((s) => s.setExecutionStream);
  const reset = useWorkspaceScopeStore((s) => s.reset);

  const { hasEntitlement } = useAuth();
  const hasLiveEntitlement = React.useMemo(() => hasEntitlement?.("execution-full") ?? false, [hasEntitlement]);

  const [expanded, setExpanded] = React.useState<boolean>(defaultExpanded);
  const [liveDialogOpen, setLiveDialogOpen] = React.useState<boolean>(false);

  const handleStreamChange = React.useCallback(
    (next: WorkspaceExecutionStream) => {
      if (next === scope.executionStream) return;
      if (next === "live") {
        // §4.3 — Live requires an explicit confirm. Disabled-with-tooltip
        // for personas without `execution-full` is enforced via the
        // SegmentedToggle's `disabled` prop below; if a caller does reach
        // this branch unentitled (e.g. URL hydration), the store's
        // hydrateScopeFromUrl already silently downgrades to paper, so we
        // never get here. Belt-and-braces: gate the dialog open too.
        if (!hasLiveEntitlement) return;
        setLiveDialogOpen(true);
        return;
      }
      setExecutionStream("paper", "execution-stream-toggle");
    },
    [scope.executionStream, hasLiveEntitlement, setExecutionStream],
  );

  const surfaceShowsTerminalMode = scope.surface === "terminal";
  const surfaceShowsResearchStage = scope.surface === "research";

  return (
    <TooltipProvider delayDuration={150}>
      <div
        className={cn("rounded-md border border-border/50 bg-muted/10", className)}
        data-testid="dart-scope-bar"
        data-surface={scope.surface}
        data-execution-stream={scope.executionStream}
        data-engagement={scope.engagement}
      >
        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
          <CompactSummary scope={scope} expanded={expanded} onToggle={() => setExpanded((e) => !e)} />
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                  onClick={() => reset("scope-bar")}
                  data-testid="dart-scope-bar-reset"
                >
                  <RotateCcw className="size-3" aria-hidden />
                  Reset
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">Clear all chips and dials back to defaults</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {expanded ? (
          <div
            id="dart-scope-bar-body"
            className="border-t border-border/30 px-3 pt-3 pb-3 space-y-3"
            data-testid="dart-scope-bar-body"
          >
            {/* Surface dial */}
            <div className="flex flex-wrap items-center gap-3">
              <SegmentedToggle<WorkspaceSurface>
                testIdPrefix="scope-surface"
                label="Surface"
                value={scope.surface}
                options={SURFACE_OPTIONS}
                onChange={(next) => setSurface(next, "surface-toggle")}
              />
              {surfaceShowsTerminalMode ? (
                <SegmentedToggle<TerminalMode>
                  testIdPrefix="scope-terminal-mode"
                  label="Mode"
                  value={scope.terminalMode ?? "command"}
                  options={TERMINAL_MODE_OPTIONS}
                  onChange={(next) => setTerminalMode(next, "terminal-mode-toggle")}
                />
              ) : null}
              {surfaceShowsResearchStage ? (
                <SegmentedToggle<ResearchStage>
                  testIdPrefix="scope-research-stage"
                  label="Stage"
                  value={scope.researchStage ?? "discover"}
                  options={RESEARCH_STAGE_OPTIONS}
                  onChange={(next) => setResearchStage(next, "research-stage-toggle")}
                />
              ) : null}
            </div>

            {/* Engagement + Stream dials */}
            <div className="flex flex-wrap items-center gap-3">
              <SegmentedToggle<WorkspaceEngagement>
                testIdPrefix="scope-engagement"
                label="Engagement"
                value={scope.engagement}
                options={ENGAGEMENT_OPTIONS}
                onChange={(next) => setEngagement(next, "engagement-toggle")}
              />
              <SegmentedToggle<WorkspaceExecutionStream>
                testIdPrefix="scope-execution-stream"
                label="Stream"
                value={scope.executionStream}
                options={[
                  { value: "paper", label: "Paper" },
                  {
                    value: "live",
                    label: "Live",
                    disabled: !hasLiveEntitlement,
                    disabledReason: "Live execution is unavailable on demo accounts.",
                  },
                ]}
                onChange={handleStreamChange}
              />
              {scope.executionStream === "live" ? (
                <Badge
                  variant="outline"
                  className="text-[10px] font-medium border-rose-500/40 bg-rose-500/10 text-rose-400 inline-flex items-center gap-1"
                  data-testid="scope-execution-stream-live-badge"
                >
                  <span aria-hidden className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
                  LIVE
                </Badge>
              ) : null}
            </div>

            {/* Filter axes (chips) — read-only display in Phase 2; the
                edit affordance for asset_group / family / archetype lives
                in the existing `<GlobalScopeFilters>` toolbar component
                that the platform shell still renders. The DartScopeBar
                owns the *summary + dials*; chip-editing lands in Phase 5
                when widget metadata + filter dropdowns wire through. */}
            <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
              <span className="uppercase tracking-wider">Active filters:</span>
              {scope.assetGroups.length === 0 &&
              scope.families.length === 0 &&
              scope.archetypes.length === 0 &&
              scope.shareClasses.length === 0 &&
              scope.instrumentTypes.length === 0 ? (
                <span className="italic">none — viewing all strategies</span>
              ) : (
                <>
                  {scope.assetGroups.map((g) => (
                    <Badge key={`ag-${g}`} variant="secondary" className="text-[10px] font-mono">
                      {g}
                    </Badge>
                  ))}
                  {scope.families.map((f) => (
                    <Badge key={`fam-${f}`} variant="secondary" className="text-[10px] font-mono">
                      {f}
                    </Badge>
                  ))}
                  {scope.archetypes.map((a) => (
                    <Badge key={`arch-${a}`} variant="secondary" className="text-[10px] font-mono">
                      {a}
                    </Badge>
                  ))}
                  {scope.shareClasses.map((sc) => (
                    <Badge key={`sc-${sc}`} variant="secondary" className="text-[10px] font-mono">
                      {sc}
                    </Badge>
                  ))}
                  {scope.instrumentTypes.map((it) => (
                    <Badge key={`it-${it}`} variant="secondary" className="text-[10px] font-mono">
                      {it}
                    </Badge>
                  ))}
                  <button
                    type="button"
                    className="ml-1 inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                    onClick={() => reset("scope-bar")}
                    data-testid="dart-scope-bar-clear-filters"
                  >
                    <X className="size-2.5" aria-hidden />
                    Clear
                  </button>
                </>
              )}
            </div>

            <p className="text-[10px] text-muted-foreground/70 inline-flex items-center gap-1">
              <Info className="size-2.5" aria-hidden />
              Chip editing for asset group / family / archetype lands in Phase 5. Use the toolbar's filter pill above for now.
            </p>
          </div>
        ) : null}
      </div>

      <LiveConfirmDialog
        open={liveDialogOpen}
        onOpenChange={setLiveDialogOpen}
        onConfirm={() => setExecutionStream("live", "execution-stream-toggle")}
      />
    </TooltipProvider>
  );
}
