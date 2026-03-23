"use client";

/**
 * /services/data/processing — Processed data status.
 * Shows timeframe completion per venue (1m → 5m → 15m → 1h → 4h → 1d),
 * processing queue, and controls to trigger processing.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Cpu, RefreshCw, Clock } from "lucide-react";
import {
  MOCK_PIPELINE_STAGES,
  MOCK_ACTIVE_JOBS,
  MOCK_JOB_HISTORY,
  MOCK_TIMEFRAME_STATUS,
} from "@/lib/data-service-mock-data";
import { type DataCategory, type Timeframe } from "@/lib/data-service-types";
import { PipelineStatusView } from "@/components/data/pipeline-status-view";

const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  "1m": "1 min",
  "5m": "5 min",
  "15m": "15 min",
  "1h": "1 hour",
  "4h": "4 hour",
  "1d": "Daily",
};

export default function ProcessingPage() {
  const [deployTarget, setDeployTarget] = React.useState<{
    venue: string;
    category: DataCategory;
  } | null>(null);

  const processingStage = MOCK_PIPELINE_STAGES.find(
    (s) => s.stage === "processing",
  );
  const processingJobs = MOCK_ACTIVE_JOBS.filter(
    (j) => j.type === "process" || j.type === "reprocess",
  );
  const processingHistory = MOCK_JOB_HISTORY.filter(
    (h) => h.jobType === "process",
  );

  const config = {
    stage: "processing" as const,
    label: "Data Processing",
    actionLabel: "Process",
    timeframeData: MOCK_TIMEFRAME_STATUS,
    onDeploy: (venue: string, category: DataCategory) => {
      setDeployTarget({ venue, category });
    },
  };

  const timeframes: Timeframe[] = ["1m", "5m", "15m", "1h", "4h", "1d"];
  const timeframeAgg = timeframes.map((tf) => {
    const entries = MOCK_TIMEFRAME_STATUS.filter((t) => t.timeframe === tf);
    const avg =
      entries.length > 0
        ? entries.reduce((s, e) => s + e.completionPct, 0) / entries.length
        : 0;
    return { tf, pct: Math.round(avg * 10) / 10 };
  });

  if (!processingStage) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">
          Processing pipeline stage is not configured in mock data.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-8 md:px-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Processing</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Processed candle status — raw ticks converted to OHLCV timeframes
            </p>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="size-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold font-mono text-sky-400">
                {processingStage.completionPct.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">
                Overall Completion
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {processingStage.completedShards.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                Shards Complete
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold font-mono text-yellow-400">
                {processingStage.inProgressShards}
              </div>
              <div className="text-xs text-muted-foreground">In Progress</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div
                className={cn(
                  "text-2xl font-bold font-mono",
                  processingStage.failedShards > 0
                    ? "text-red-400"
                    : "text-muted-foreground",
                )}
              >
                {processingStage.failedShards}
              </div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="size-4" />
              Timeframe Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {timeframeAgg.map(({ tf, pct }) => (
                <div
                  key={tf}
                  className="text-center p-3 rounded-lg border border-border"
                >
                  <div
                    className={cn(
                      "text-xl font-bold font-mono",
                      pct >= 95
                        ? "text-emerald-400"
                        : pct >= 80
                          ? "text-yellow-400"
                          : "text-red-400",
                    )}
                  >
                    {pct.toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {TIMEFRAME_LABELS[tf]}
                  </div>
                  <Progress value={pct} className="h-1 mt-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <PipelineStatusView
          config={config}
          stage={processingStage}
          jobs={processingJobs}
          jobHistory={processingHistory}
        />

        {deployTarget && (
          <Card className="mt-6 border-primary/30 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Cpu className="size-5 text-primary" />
                  <div>
                    <div className="text-sm font-medium">
                      Process job ready: {deployTarget.venue.replace(/_/g, " ")}{" "}
                      ({deployTarget.category})
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Select date range, timeframes, and force flag
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeployTarget(null)}
                  >
                    Cancel
                  </Button>
                  <Button size="sm">Configure & Process</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
