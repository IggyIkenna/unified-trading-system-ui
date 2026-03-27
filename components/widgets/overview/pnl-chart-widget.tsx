"use client";

import * as React from "react";
import type { WidgetComponentProps } from "../widget-registry";
import { LiveBatchComparison } from "@/components/trading/live-batch-comparison";
import { DriftAnalysisPanel } from "@/components/trading/drift-analysis-panel";
import { ValueFormatToggle, useValueFormat } from "@/components/trading/value-format-toggle";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, Database, Loader2, Radio } from "lucide-react";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import { useOverviewData } from "./overview-data-context";

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

export function PnLChartWidget(_props: WidgetComponentProps) {
  const { liveTimeSeries, batchTimeSeries, realtimePnlPoints, timeseriesLoading, liveBatchLoading, formatCurrency } =
    useOverviewData();

  const { scope: context } = useGlobalScope();
  const [showTimeSeries, setShowTimeSeries] = React.useState(true);
  const [batchDate, setBatchDate] = React.useState(getYesterday());
  const { format: valueFormat, setFormat: setValueFormat } = useValueFormat("dollar");

  return (
    <div className="p-3 space-y-2 h-full overflow-auto">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowTimeSeries(!showTimeSeries)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {showTimeSeries ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          <span>{showTimeSeries ? "Hide" : "Show"} Time Series</span>
        </button>
        <ValueFormatToggle format={valueFormat} onFormatChange={setValueFormat} className="ml-2" />
        <Badge variant="outline" className="ml-2 text-[10px]">
          {context.mode === "live" ? (
            <span className="flex items-center gap-1">
              <Radio className="size-2.5 animate-pulse text-[var(--status-live)]" />
              Live
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Database className="size-2.5" />
              Batch ({context.asOfDatetime?.split("T")[0]})
            </span>
          )}
        </Badge>
        {(timeseriesLoading || liveBatchLoading) && (
          <Loader2 className="size-3.5 animate-spin text-muted-foreground ml-1" />
        )}
      </div>

      {showTimeSeries && (
        <Tabs defaultValue="pnl" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pnl">P&L</TabsTrigger>
            <TabsTrigger value="nav">NAV</TabsTrigger>
            <TabsTrigger value="exposure">Exposure</TabsTrigger>
          </TabsList>
          <TabsContent value="pnl">
            <LiveBatchComparison
              title="Cumulative P&L"
              liveData={[...liveTimeSeries.pnl, ...realtimePnlPoints]}
              batchData={batchTimeSeries.pnl}
              valueFormatter={formatCurrency}
              height={220}
              selectedDate={batchDate}
              onDateChange={setBatchDate}
            />
          </TabsContent>
          <TabsContent value="nav">
            <LiveBatchComparison
              title="Net Asset Value"
              liveData={liveTimeSeries.nav}
              batchData={batchTimeSeries.nav}
              valueFormatter={formatCurrency}
              height={220}
              selectedDate={batchDate}
              onDateChange={setBatchDate}
            />
          </TabsContent>
          <TabsContent value="exposure">
            <LiveBatchComparison
              title="Net Exposure"
              liveData={liveTimeSeries.exposure}
              batchData={batchTimeSeries.exposure}
              valueFormatter={formatCurrency}
              height={220}
              selectedDate={batchDate}
              onDateChange={setBatchDate}
            />
          </TabsContent>
        </Tabs>
      )}

      {showTimeSeries && (
        <DriftAnalysisPanel
          metrics={[
            {
              label: "P&L",
              liveValue: liveTimeSeries.pnl[liveTimeSeries.pnl.length - 1]?.value || 0,
              batchValue: batchTimeSeries.pnl[batchTimeSeries.pnl.length - 1]?.value || 0,
              threshold: 2,
            },
            {
              label: "Net Exposure",
              liveValue: liveTimeSeries.exposure[liveTimeSeries.exposure.length - 1]?.value || 0,
              batchValue: batchTimeSeries.exposure[batchTimeSeries.exposure.length - 1]?.value || 0,
              threshold: 5,
            },
            {
              label: "NAV",
              liveValue: liveTimeSeries.nav[liveTimeSeries.nav.length - 1]?.value || 0,
              batchValue: batchTimeSeries.nav[batchTimeSeries.nav.length - 1]?.value || 0,
              threshold: 1,
            },
          ]}
          unreconciledItems={[]}
          batchAsOf={`${batchDate} 23:59 UTC`}
          liveAsOf="Now"
        />
      )}
    </div>
  );
}
