"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDeploymentDetailsModelContext } from "./deployment-details-context";

import { DeploymentDetailsEventsTabPanel } from "./deployment-details-events-tab-panel";
import { DeploymentDetailsLogsTabPanel } from "./deployment-details-logs-tab-panel";
import { DeploymentDetailsReportTabPanel } from "./deployment-details-report-tab-panel";
import { DeploymentDetailsShardsTabPanel } from "./deployment-details-shards-tab-panel";

export function DeploymentDetailsTabs() {
  const dd = useDeploymentDetailsModelContext();
  const {
    status,
    logs,
    logsLoading,
    logsHoursBack,
    fetchLogs,
    fetchReport,
    report,
    events,
    eventsLoading,
    fetchEvents,
  } = dd;

  if (!status) return null;

  return (
    <Tabs defaultValue="shards" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="shards">Shards ({status.total_shards})</TabsTrigger>
        <TabsTrigger
          value="logs"
          onClick={() => {
            // Lazy-load logs to keep initial render fast
            if (logs.length === 0 && !logsLoading) {
              fetchLogs("DEFAULT", false, logsHoursBack);
            }
          }}
        >
          Logs ({logs.length})
        </TabsTrigger>
        <TabsTrigger value="report" onClick={() => !report && fetchReport()}>
          Report
        </TabsTrigger>
        <TabsTrigger
          value="events"
          onClick={() => {
            if (events.length === 0 && !eventsLoading) {
              fetchEvents();
            }
          }}
        >
          Events {events.length > 0 ? `(${events.length})` : ""}
        </TabsTrigger>
      </TabsList>

      <DeploymentDetailsShardsTabPanel />
      <DeploymentDetailsLogsTabPanel />
      <DeploymentDetailsReportTabPanel />
      <DeploymentDetailsEventsTabPanel />
    </Tabs>
  );
}
