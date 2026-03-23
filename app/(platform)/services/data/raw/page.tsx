"use client";

/**
 * /services/data/raw — Raw data ingestion status.
 * Shows download progress per venue, completion heatmaps, active jobs,
 * and controls to trigger new downloads.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, RefreshCw } from "lucide-react";
import {
  MOCK_PIPELINE_STAGES,
  MOCK_ACTIVE_JOBS,
  MOCK_JOB_HISTORY,
} from "@/lib/data-service-mock-data";
import { type DataCategory } from "@/lib/data-service-types";
import { PipelineStatusView } from "@/components/data/pipeline-status-view";

export default function RawDataPage() {
  const [deployTarget, setDeployTarget] = React.useState<{
    venue: string;
    category: DataCategory;
  } | null>(null);

  const rawStage = MOCK_PIPELINE_STAGES.find((s) => s.stage === "raw");
  const rawJobs = MOCK_ACTIVE_JOBS.filter(
    (j) => j.type === "download" || j.type === "backfill",
  );
  const rawHistory = MOCK_JOB_HISTORY.filter(
    (h) => h.jobType === "download" || h.jobType === "backfill",
  );

  const config = {
    stage: "raw" as const,
    label: "Raw Data Download",
    actionLabel: "Download",
    onDeploy: (venue: string, category: DataCategory) => {
      setDeployTarget({ venue, category });
    },
  };

  if (!rawStage) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">
          Raw pipeline stage is not configured in mock data.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-8 md:px-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Raw Data</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Download status for raw market data — ticks, trades, events, odds
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
                {rawStage.completionPct.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">
                Overall Completion
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {rawStage.completedShards.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                Shards Complete
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold font-mono text-yellow-400">
                {rawStage.inProgressShards}
              </div>
              <div className="text-xs text-muted-foreground">In Progress</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div
                className={cn(
                  "text-2xl font-bold font-mono",
                  rawStage.failedShards > 0
                    ? "text-red-400"
                    : "text-muted-foreground",
                )}
              >
                {rawStage.failedShards}
              </div>
              <div className="text-xs text-muted-foreground">Failed</div>
            </CardContent>
          </Card>
        </div>

        <PipelineStatusView
          config={config}
          stage={rawStage}
          jobs={rawJobs}
          jobHistory={rawHistory}
        />

        {deployTarget && (
          <Card className="mt-6 border-primary/30 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Download className="size-5 text-primary" />
                  <div>
                    <div className="text-sm font-medium">
                      Download job ready:{" "}
                      {deployTarget.venue.replace(/_/g, " ")} (
                      {deployTarget.category})
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Opens full deploy dialog — select date range, workers,
                      force flag
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
                  <Button size="sm">Configure & Deploy</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
