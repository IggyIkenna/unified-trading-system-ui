"use client";

import {
  X,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  AlertCircle,
  Terminal,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  StopCircle,
  Play,
  Square,
  CheckSquare,
  Edit2,
  Check,
  Tag,
  List,
  Layers,
  ChevronRight,
  FolderOpen,
  Folder,
  GitCommit,
  FileText,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, formatDateTime } from "@/lib/utils";
import { VM_EVENT_TYPES } from "@/lib/types/deployment";
import { StatBox } from "./stat-box";
import { ShardRow } from "./shard-row";
import { DeploymentStatusBadge } from "./deployment-status-badge";
import { useDeploymentDetailsModelContext } from "./deployment-details-context";

import { DeploymentDetailsShardsTabPanel } from "./deployment-details-shards-tab-panel";
import { DeploymentDetailsLogsTabPanel } from "./deployment-details-logs-tab-panel";
import { DeploymentDetailsReportTabPanel } from "./deployment-details-report-tab-panel";
import { DeploymentDetailsEventsTabPanel } from "./deployment-details-events-tab-panel";

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
