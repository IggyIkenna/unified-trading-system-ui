"use client";

import { Spinner } from "@/components/ui/spinner";
/**
 * PipelineStatusView — Reusable ETL pipeline status component.
 * Used by Raw Data, Processing tabs (and future Build tab: Feature ETL, Model Training).
 * Shows per-category progress, per-venue/service breakdown with expandable heatmap,
 * active jobs panel, and deploy action button.
 */

import { FreshnessHeatmap } from "@/components/data/freshness-heatmap";
import { CATEGORY_COLORS } from "@/components/data/shard-catalogue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useScopedCategories } from "@/hooks/use-scoped-categories";
import { MOCK_SHARD_AVAILABILITY } from "@/lib/mocks/fixtures/data-service";
import {
  DATA_CATEGORY_LABELS,
  VENUES_BY_CATEGORY,
  type DataCategory,
  type JobHistoryEntry,
  type JobInfo,
  type PipelineStageSummary,
  type TimeframeStatus,
} from "@/lib/types/data-service";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Lock, Play, RefreshCw, Users } from "lucide-react";
import * as React from "react";
import { formatPercent } from "@/lib/utils/formatters";

export interface PipelineStageConfig {
  stage: "raw" | "processing" | "features" | "training";
  label: string;
  actionLabel: string;
  onDeploy?: (venue: string, category: DataCategory) => void;
  timeframeData?: TimeframeStatus[];
}

interface VenueRowProps {
  venue: string;
  category: DataCategory;
  config: PipelineStageConfig;
  job?: JobInfo;
  historyEntry?: JobHistoryEntry;
}

function formatMs(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function stableFallbackPct(venue: string, category: DataCategory): number {
  let h = 0;
  for (let i = 0; i < venue.length; i++) {
    h = (h + venue.charCodeAt(i) * (i + 1)) % 97;
  }
  h = (h + category.length * 13) % 40;
  return 60 + h;
}

function VenueRow({ venue, category, config, job, historyEntry }: VenueRowProps) {
  const [expanded, setExpanded] = React.useState(false);

  const shardData = MOCK_SHARD_AVAILABILITY.find(
    (s) => s.venue === venue || s.venue.toLowerCase().includes(venue.toLowerCase()),
  );

  const completionPct =
    job?.progressPct ?? (historyEntry ? Math.round(historyEntry.successRate) : stableFallbackPct(venue, category));
  const isActive = job?.status === "running";
  const isFailed = job?.status === "failed";

  const statusDot = isActive
    ? "bg-emerald-500 animate-pulse"
    : isFailed
      ? "bg-red-500"
      : completionPct >= 95
        ? "bg-emerald-500"
        : completionPct >= 80
          ? "bg-yellow-500"
          : "bg-red-500";

  const tfData = config.timeframeData?.filter((t) => t.venue === venue && t.category === category) ?? [];
  const timeframes = ["1m", "5m", "15m", "1h", "4h", "1d"] as const;

  return (
    <div>
      <div
        role="row"
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-accent/30 transition-colors border-t border-border/50 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {expanded ? (
            <ChevronDown className="size-3.5 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronRight className="size-3.5 text-muted-foreground flex-shrink-0" />
          )}
          <span className={cn("size-2 rounded-full flex-shrink-0", statusDot)} />
          <span className="text-sm font-medium capitalize truncate">{venue.replace(/_/g, " ")}</span>
          {isActive && (
            <Badge variant="secondary" className="text-[10px] flex-shrink-0">
              <Spinner className="size-2.5 mr-1" />
              Running
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          {job && (
            <span className="text-xs text-muted-foreground">
              {job.workersActive}/{job.workersMax} workers
            </span>
          )}
          <div className="flex items-center gap-2">
            <Progress value={completionPct} className="h-1.5 w-20" />
            <span
              className={cn(
                "text-xs font-mono w-10 text-right",
                completionPct >= 95 ? "text-emerald-400" : completionPct >= 80 ? "text-yellow-400" : "text-red-400",
              )}
            >
              {completionPct}%
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              config.onDeploy?.(venue, category);
            }}
          >
            <Play className="size-3 mr-1" />
            {config.actionLabel}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="px-8 py-4 bg-accent/10 border-t border-border/30 space-y-4">
          {config.stage === "processing" && tfData.length > 0 && (
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">Timeframe Completion</div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {timeframes.map((tf) => {
                  const tfEntry = tfData.find((t) => t.timeframe === tf);
                  const pct = tfEntry?.completionPct ?? 0;
                  return (
                    <div key={tf} className="text-center">
                      <div
                        className={cn(
                          "text-sm font-mono font-semibold",
                          pct >= 95 ? "text-emerald-400" : pct >= 80 ? "text-yellow-400" : "text-muted-foreground",
                        )}
                      >
                        {pct > 0 ? `${formatPercent(pct, 0)}` : "—"}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{tf}</div>
                      {pct > 0 && <Progress value={pct} className="h-0.5 mt-1" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {shardData?.byDate && (
            <FreshnessHeatmap
              dateMap={shardData.byDate}
              label={`${venue.replace(/_/g, " ")} · completion by date`}
              weeksToShow={13}
            />
          )}

          {historyEntry && (
            <div className="text-xs text-muted-foreground flex flex-wrap gap-4">
              <span>
                Avg: <span className="text-foreground font-mono">{formatMs(historyEntry.avgDurationMs)}</span>
              </span>
              <span>
                p90: <span className="text-foreground font-mono">{formatMs(historyEntry.p90DurationMs)}</span>
              </span>
              <span>
                Success rate:{" "}
                <span className="text-emerald-400 font-mono">{formatPercent(historyEntry.successRate, 1)}</span>
              </span>
              <span>
                Runs: <span className="text-foreground font-mono">{historyEntry.runCount}</span>
              </span>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => config.onDeploy?.(venue, category)}
            >
              <Play className="size-3 mr-1" />
              Download Missing
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
              View Logs
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface PipelineStatusViewProps {
  config: PipelineStageConfig;
  stage: PipelineStageSummary;
  jobs: JobInfo[];
  jobHistory: JobHistoryEntry[];
  className?: string;
}

export function PipelineStatusView({ config, stage, jobs, jobHistory, className }: PipelineStatusViewProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<DataCategory | "all">("all");
  const { subscribed, locked } = useScopedCategories();

  const activeJobs = jobs.filter((j) => j.status === "running" || j.status === "queued");

  // Only show venue rows for subscribed categories
  const visibleCategories = subscribed.length > 0 ? subscribed : (Object.keys(DATA_CATEGORY_LABELS) as DataCategory[]);

  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {stage.byCategory
          .filter((catData) => subscribed.length === 0 || subscribed.includes(catData.category))
          .map((catData) => {
            const pct = catData.completionPct;
            return (
              <button
                type="button"
                key={catData.category}
                onClick={() => setSelectedCategory(selectedCategory === catData.category ? "all" : catData.category)}
                className={cn(
                  "text-left p-3 rounded-lg border transition-colors",
                  selectedCategory === catData.category
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-accent/30",
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Badge variant="outline" className={cn("text-xs", CATEGORY_COLORS[catData.category])}>
                    {DATA_CATEGORY_LABELS[catData.category]}
                  </Badge>
                  <span
                    className={cn(
                      "text-xs font-mono font-semibold",
                      pct >= 95 ? "text-emerald-400" : pct >= 80 ? "text-yellow-400" : "text-red-400",
                    )}
                  >
                    {formatPercent(pct, 0)}
                  </span>
                </div>
                <Progress value={pct} className="h-1.5" />
                <div className="text-[10px] text-muted-foreground mt-1">
                  {catData.completedShards.toLocaleString()} / {catData.totalShards.toLocaleString()} shards
                </div>
              </button>
            );
          })}

        {locked.map((cat) => (
          <div key={cat} className="p-3 rounded-lg border border-border/40 bg-muted/20 opacity-60 relative">
            <div className="flex items-center justify-between mb-1.5">
              <Badge variant="outline" className={cn("text-xs", CATEGORY_COLORS[cat])}>
                {DATA_CATEGORY_LABELS[cat]}
              </Badge>
              <Lock className="size-3 text-muted-foreground" />
            </div>
            <div className="text-[10px] text-muted-foreground">Upgrade to access</div>
          </div>
        ))}
      </div>

      {activeJobs.length > 0 && (
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Spinner className="size-4 text-emerald-400" />
              {activeJobs.length} Active Job{activeJobs.length > 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        job.status === "running" ? "bg-emerald-500 animate-pulse" : "bg-yellow-500",
                      )}
                    />
                    <span className="capitalize">{DATA_CATEGORY_LABELS[job.category]}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="capitalize">{job.venue.replace(/_/g, " ")}</span>
                    <span className="text-muted-foreground">
                      {job.dateRange.start} → {job.dateRange.end}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Users className="size-3 text-muted-foreground" />
                      <span>
                        {job.workersActive}/{job.workersMax}
                      </span>
                    </div>
                    <Progress value={job.progressPct} className="h-1 w-16" />
                    <span className="font-mono">{job.progressPct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">
              {selectedCategory === "all" ? "All Venues" : DATA_CATEGORY_LABELS[selectedCategory]}
            </CardTitle>
            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs">
              <RefreshCw className="size-3.5 mr-1" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-0 pb-2">
          {visibleCategories
            .filter((cat) => selectedCategory === "all" || cat === selectedCategory)
            .map((cat) => {
              const venues = VENUES_BY_CATEGORY[cat];
              return venues.map((venue) => {
                const job = jobs.find((j) => j.venue === venue && j.category === cat);
                const history = jobHistory.find((h) => h.venue === venue && h.category === cat);
                return (
                  <VenueRow
                    key={`${cat}:${venue}`}
                    venue={venue}
                    category={cat}
                    config={config}
                    job={job}
                    historyEntry={history}
                  />
                );
              });
            })}
        </CardContent>
      </Card>
    </div>
  );
}
