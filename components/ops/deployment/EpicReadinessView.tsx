"use client";

import { useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  GitMerge,
  Database,
  FlaskConical,
  Wifi,
  Archive,
} from "lucide-react";
import { useEpics, useEpicDetail } from "@/hooks/deployment/useEpics";
import { Spinner } from "@/components/shared/spinner";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EpicSummary, EpicRepoStatus } from "@/lib/types/deployment";

// ---------------------------------------------------------------------------
// Circular progress ring
// ---------------------------------------------------------------------------

interface RadialProgressProps {
  pct: number;
  size?: number;
  strokeWidth?: number;
}

function RadialProgress({ pct, size = 56, strokeWidth = 5 }: RadialProgressProps) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;
  const color =
    pct === 100 ? "var(--color-accent-green)" : pct >= 50 ? "var(--color-accent-cyan)" : "var(--color-accent-orange)";

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--color-border-subtle)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.4s ease" }}
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EPIC_COLORS: Record<string, string> = {
  defi: "text-[var(--color-accent-cyan)]",
  cefi: "text-[var(--color-accent-green)]",
  tradfi: "text-[var(--color-accent-orange)]",
  sports: "text-purple-400",
};

const EPIC_BORDER: Record<string, string> = {
  defi: "border-[var(--color-accent-cyan)]/25",
  cefi: "border-[var(--color-accent-green)]/25",
  tradfi: "border-[var(--color-accent-orange)]/25",
  sports: "border-[var(--color-accent-purple)]/25",
};

function crColor(current: string | null, required: string): string {
  if (!current) return "text-[var(--color-text-muted)]";
  const ord = (s: string) => parseInt(s.replace(/[^0-9]/g, "") || "0", 10);
  return ord(current) >= ord(required) ? "text-[var(--color-accent-green)]" : "text-[var(--color-accent-red)]";
}

function DataChips({ data }: { data: EpicRepoStatus["data"] }) {
  if (!data) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {data.historical_available && (
        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-accent-cyan)]/12 text-[var(--color-accent-cyan)] border border-[var(--color-accent-cyan)]/20">
          <Archive className="h-2.5 w-2.5" />
          hist
          {data.historical_start_date && (
            <span className="text-[var(--color-text-muted)]">{data.historical_start_date.slice(0, 7)}</span>
          )}
        </span>
      )}
      {data.live_available && (
        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-accent-green)]/12 text-[var(--color-accent-green)] border border-[var(--color-accent-green)]/20">
          <Wifi className="h-2.5 w-2.5" />
          live
        </span>
      )}
      {data.mock_available && (
        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] border border-[var(--color-border-default)]">
          <FlaskConical className="h-2.5 w-2.5" />
          mock
        </span>
      )}
      {data.testnet_available && (
        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-accent-orange)]/12 text-[var(--color-accent-orange)] border border-[var(--color-accent-orange)]/20">
          <Database className="h-2.5 w-2.5" />
          testnet
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Epic card (summary)
// ---------------------------------------------------------------------------

interface EpicCardProps {
  epic: EpicSummary;
  selected: boolean;
  onClick: () => void;
}

function EpicCard({ epic, selected, onClick }: EpicCardProps) {
  const colorClass = EPIC_COLORS[epic.epic_id] ?? "text-[var(--color-text-primary)]";
  const borderClass = EPIC_BORDER[epic.epic_id] ?? "border-[var(--color-border-default)]";

  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-lg border p-4 transition-colors h-auto",
        "bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)]",
        borderClass,
        selected && "ring-1 ring-[var(--color-accent-cyan)]",
      )}
    >
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <RadialProgress pct={epic.epic_pct} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-semibold text-[var(--color-text-primary)]">{epic.epic_pct}%</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("font-semibold text-sm", colorClass)}>{epic.display_name}</span>
            {epic.epic_complete ? (
              <Badge
                variant="outline"
                className="text-[10px] border-[var(--color-accent-green)] text-[var(--color-accent-green)]"
              >
                Complete
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px]">
                P{epic.mvp_priority}
              </Badge>
            )}
          </div>
          <div className="text-xs text-[var(--color-text-muted)]">
            {epic.completed} / {epic.total_required} repos ready
            {epic.blocking_count > 0 && (
              <span className="ml-2 text-[var(--color-accent-red)]">· {epic.blocking_count} blocking</span>
            )}
          </div>
        </div>
        {selected ? (
          <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)] flex-shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)] flex-shrink-0" />
        )}
      </div>
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Repo row in the expanded detail table
// ---------------------------------------------------------------------------

function RepoRow({ repo, blocking }: { repo: EpicRepoStatus; blocking: boolean }) {
  return (
    <tr
      className={cn(
        "border-b border-[var(--color-border-subtle)] last:border-0",
        blocking ? "bg-[var(--color-accent-red)]/4" : "bg-[var(--color-accent-green)]/4",
      )}
    >
      <td className="py-2 px-3 text-xs font-mono text-[var(--color-text-primary)]">
        <div className="flex items-center gap-1.5">
          {blocking ? (
            <AlertCircle className="h-3 w-3 text-[var(--color-accent-red)] flex-shrink-0" />
          ) : (
            <CheckCircle2 className="h-3 w-3 text-[var(--color-accent-green)] flex-shrink-0" />
          )}
          {repo.repo}
        </div>
      </td>
      <td className="py-2 px-3 text-xs text-[var(--color-text-muted)]">{repo.asset_class}</td>
      <td className={cn("py-2 px-3 text-xs font-mono", crColor(repo.cr_current, repo.cr_required))}>
        {repo.cr_current ?? "—"} <span className="text-[var(--color-text-muted)]">/ {repo.cr_required}</span>
      </td>
      <td className="py-2 px-3 text-xs font-mono text-[var(--color-text-secondary)]">
        {repo.br_required === "na" ? (
          <span className="text-[var(--color-text-muted)]">n/a</span>
        ) : (
          <>
            <span className={crColor(repo.br_current, repo.br_required)}>{repo.br_current ?? "—"}</span>{" "}
            <span className="text-[var(--color-text-muted)]">/ {repo.br_required}</span>
          </>
        )}
      </td>
      <td className="py-2 px-3 text-xs">
        {repo.main_quickmerged ? (
          <span className="inline-flex items-center gap-1 text-[var(--color-accent-green)]">
            <GitMerge className="h-3 w-3" />
            merged
          </span>
        ) : (
          <span className="text-[var(--color-text-muted)]">—</span>
        )}
      </td>
      <td className="py-2 px-3">
        <DataChips data={repo.data} />
      </td>
      {blocking && <td className="py-2 px-3 text-xs text-[var(--color-accent-red)]">{repo.blocking_reason ?? ""}</td>}
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Expanded epic detail panel
// ---------------------------------------------------------------------------

interface EpicDetailPanelProps {
  epicId: string;
}

function EpicDetailPanel({ epicId }: EpicDetailPanelProps) {
  const { epic, loading, error } = useEpicDetail(epicId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner className="size-6 text-[var(--color-accent-cyan)]" size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 py-4 text-[var(--color-accent-red)] text-sm px-3">
        <AlertCircle className="h-4 w-4" />
        {error}
      </div>
    );
  }

  if (!epic) return null;

  const hasBlocking = epic.blocking_repos.length > 0;
  const hasCompleted = epic.completed_repos.length > 0;

  return (
    <div className="mt-3 space-y-4">
      {hasBlocking && (
        <div>
          <h4 className="text-xs font-semibold text-[var(--color-accent-red)] uppercase tracking-wide mb-2 px-1">
            Blocking ({epic.blocking_repos.length})
          </h4>
          <WidgetScroll
            axes="horizontal"
            scrollbarSize="thin"
            className="rounded border border-[var(--color-border-default)]"
          >
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="border-b border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)]">
                  <th className="py-1.5 px-3 text-[10px] text-[var(--color-text-muted)] uppercase">Repo</th>
                  <th className="py-1.5 px-3 text-[10px] text-[var(--color-text-muted)] uppercase">Class</th>
                  <th className="py-1.5 px-3 text-[10px] text-[var(--color-text-muted)] uppercase">CR</th>
                  <th className="py-1.5 px-3 text-[10px] text-[var(--color-text-muted)] uppercase">BR</th>
                  <th className="py-1.5 px-3 text-[10px] text-[var(--color-text-muted)] uppercase">Main</th>
                  <th className="py-1.5 px-3 text-[10px] text-[var(--color-text-muted)] uppercase">Data</th>
                  <th className="py-1.5 px-3 text-[10px] text-[var(--color-text-muted)] uppercase">Reason</th>
                </tr>
              </thead>
              <tbody>
                {epic.blocking_repos.map((r) => (
                  <RepoRow key={`${r.repo}-${r.asset_class}`} repo={r} blocking={true} />
                ))}
              </tbody>
            </table>
          </WidgetScroll>
        </div>
      )}

      {hasCompleted && (
        <div>
          <h4 className="text-xs font-semibold text-[var(--color-accent-green)] uppercase tracking-wide mb-2 px-1">
            Complete ({epic.completed_repos.length})
          </h4>
          <div className="flex flex-wrap gap-1.5 px-1">
            {epic.completed_repos.map((repo) => (
              <span
                key={repo}
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent-green)]/10 border border-[var(--color-accent-green)]/20 text-[var(--color-accent-green)] font-mono"
              >
                <CheckCircle2 className="h-3 w-3" />
                {repo}
              </span>
            ))}
          </div>
        </div>
      )}

      {epic.optional_repos_status.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2 px-1">
            Optional ({epic.optional_repos_status.length})
          </h4>
          <div className="flex flex-wrap gap-1.5 px-1">
            {epic.optional_repos_status.map((r) => (
              <span
                key={`${r.repo}-${r.asset_class}`}
                className={cn(
                  "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-mono border",
                  r.yaml_present
                    ? "bg-[var(--color-bg-tertiary)] border-[var(--color-border-default)] text-[var(--color-text-secondary)]"
                    : "bg-transparent border-[var(--color-border-subtle)] text-[var(--color-text-muted)]",
                )}
                title={r.note || undefined}
              >
                {r.repo}
                <span className="text-[var(--color-text-muted)]">·{r.asset_class}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export function EpicReadinessView() {
  const { epics, loading, error, refetch } = useEpics();
  const [selectedEpicId, setSelectedEpicId] = useState<string | null>(null);

  const handleCardClick = (epicId: string) => {
    setSelectedEpicId((prev) => (prev === epicId ? null : epicId));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Epic Readiness</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors h-7 w-7"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Spinner className="size-8 text-[var(--color-accent-cyan)]" size="lg" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 py-6 text-[var(--color-accent-red)]">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && epics.length === 0 && (
          <div className="py-8 text-center text-sm text-[var(--color-text-muted)]">
            No epics configured. Ensure{" "}
            <code className="text-xs">unified-trading-codex/11-project-management/epics/</code> is accessible.
          </div>
        )}

        {!loading && !error && epics.length > 0 && (
          <div className="space-y-3">
            {epics.map((epic) => (
              <div key={epic.epic_id}>
                <EpicCard
                  epic={epic}
                  selected={selectedEpicId === epic.epic_id}
                  onClick={() => handleCardClick(epic.epic_id)}
                />
                {selectedEpicId === epic.epic_id && (
                  <div className="mt-2 ml-2 pl-3 border-l border-[var(--color-border-default)]">
                    <EpicDetailPanel epicId={epic.epic_id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
