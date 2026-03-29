"use client";

/**
 * /services/data/raw — Raw data ingestion status.
 * FinderBrowser layout: Category → Venue → Instrument Type → Data Type
 * Shows completion %, date range, and freshness per data type.
 */

import { RAW_DATA_COLUMNS, getRawDataContextStats } from "@/components/data/raw-data-finder-config";
import { PageHeader } from "@/components/shared/page-header";
import type { FinderSelections } from "@/components/shared/finder";
import { FinderBrowser, finderText } from "@/components/shared/finder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MOCK_PIPELINE_STAGES } from "@/lib/mocks/fixtures/data-service";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/formatters";
import { AlertTriangle, CheckCircle2, Download, RefreshCw } from "lucide-react";

// ─── Detail panel ─────────────────────────────────────────────────────────────

function RawDataDetail({ selections }: { selections: FinderSelections }) {
  const dtItem = selections["datatype"];
  const folderData = selections["folder"]?.data as { folder: string; venue: string; cat: string } | undefined;
  const venueData = selections["venue"]?.data as { venue: string; cat: string } | undefined;

  if (dtItem) {
    const { dt, venue, folder, completionPct } = dtItem.data as {
      dt: string;
      venue: string;
      folder: string;
      completionPct: number;
    };
    const color = completionPct >= 90 ? "text-emerald-400" : completionPct >= 70 ? "text-yellow-400" : "text-red-400";
    const barColor = completionPct >= 90 ? "bg-emerald-400" : completionPct >= 70 ? "bg-yellow-400" : "bg-red-400";

    return (
      <div className="p-4 space-y-4">
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Data Type</p>
          <p className="text-sm font-semibold font-mono capitalize">{dt.replace(/_/g, " ")}</p>
          <p className="text-xs text-muted-foreground">
            {venue.replace(/_/g, " ")} / {folder.replace(/_/g, " ")}
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Completion</span>
            <span className={cn("font-mono font-bold", color)}>{completionPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", barColor)}
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-muted-foreground">Status</p>
            <div className="flex items-center gap-1 mt-0.5">
              {completionPct >= 90 ? (
                <>
                  <CheckCircle2 className="size-3 text-emerald-400" />
                  <span className="text-emerald-400">Healthy</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="size-3 text-amber-400" />
                  <span className="text-amber-400">Partial</span>
                </>
              )}
            </div>
          </div>
          <div>
            <p className="text-muted-foreground">Data type</p>
            <p className="font-mono">{dt}</p>
          </div>
        </div>
        <Button size="sm" className="w-full gap-2">
          <Download className="size-3" /> Configure Download
        </Button>
      </div>
    );
  }

  if (folderData) {
    return (
      <div className="p-4 space-y-3">
        <p className="text-sm font-semibold capitalize">{folderData.folder.replace(/_/g, " ")}</p>
        <p className="text-xs text-muted-foreground">Select a data type to see completion details</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <Download className="size-8 mb-2 opacity-20" />
      <p className="text-sm font-medium text-muted-foreground">No data type selected</p>
      <p className="text-xs text-muted-foreground/60 mt-1">Drill down to see completion % and configure downloads</p>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function RawDataPage() {
  const rawStage = MOCK_PIPELINE_STAGES.find((s) => s.stage === "raw");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="border-b border-border/50 px-6 pt-4 pb-3">
        <PageHeader
          title="Raw Data"
          description={
            rawStage
              ? `${formatNumber(rawStage.completionPct, 1)}% overall · ${formatNumber(rawStage.completedShards, 0)} shards complete`
              : "Download status for raw market data"
          }
        >
          {rawStage && rawStage.failedShards > 0 && (
            <Badge variant="outline" className="text-xs gap-1.5 border-red-400/30 text-red-400">
              <AlertTriangle className="size-3" />
              {rawStage.failedShards} failed
            </Badge>
          )}
          {rawStage && rawStage.inProgressShards > 0 && (
            <Badge variant="outline" className="text-xs gap-1.5 border-blue-400/30 text-blue-400">
              {rawStage.inProgressShards} active
            </Badge>
          )}
          <Button variant="outline" size="sm">
            <RefreshCw className="size-4 mr-2" />
            Refresh
          </Button>
        </PageHeader>
      </div>

      {/* FinderBrowser */}
      <FinderBrowser
        columns={RAW_DATA_COLUMNS}
        detailPanel={(selections) => <RawDataDetail selections={selections} />}
        contextStats={getRawDataContextStats}
        detailPanelTitle="Data Type Detail"
        emptyState={
          <div className="text-center">
            <Download className="size-10 mb-2 opacity-20 mx-auto" />
            <p className={cn(finderText.title, "font-medium")}>Select a category</p>
            <p className={cn(finderText.sub, "opacity-60 mt-1")}>Browse raw data availability by venue and data type</p>
          </div>
        }
      />
    </div>
  );
}
