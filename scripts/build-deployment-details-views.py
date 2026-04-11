#!/usr/bin/env python3
from pathlib import Path

bak = Path(
    "/home/hk/unified-trading-system-repos/unified-trading-system-ui/components/ops/deployment/DeploymentDetails.tsx.bak",
).read_text(encoding="utf-8").splitlines()
det = Path(
    "/home/hk/unified-trading-system-repos/unified-trading-system-ui/components/ops/deployment/details",
)

HEADER_IMPORTS = '''"use client";

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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatDateTime } from "@/lib/utils";
import { VM_EVENT_TYPES } from "@/lib/types/deployment";
import { StatBox } from "./stat-box";
import { ShardRow } from "./shard-row";
import { DeploymentStatusBadge } from "./deployment-status-badge";
import { useDeploymentDetailsModelContext } from "./deployment-details-context";
'''

DESTRUCTURE = """  const {
    deploymentId,
    onClose,
    status,
    logs,
    logsMessage,
    logsHoursBack,
    setLogsHoursBack,
    logsLoading,
    showAllShards,
    setShowAllShards,
    viewMode,
    setViewMode,
    expandedCategories,
    allShards,
    shardsLoading,
    shardStatusFilter,
    setShardStatusFilter,
    shardSearchText,
    setShardSearchText,
    shardPage,
    shardPageLoading,
    fetchShardPage,
    actionLoading,
    actionError,
    actionSuccess,
    setActionSuccess,
    selectedShards,
    editingTag,
    setEditingTag,
    tagValue,
    setTagValue,
    report,
    reportLoading,
    rerunCommands,
    events,
    eventsLoading,
    eventsExpanded,
    setEventsExpanded,
    liveHealth,
    selectedShardForLogs,
    shardLogs,
    shardLogsLoading,
    shardLogsMessage,
    vmLogShardId,
    setVmLogShardId,
    logSearch,
    setLogSearch,
    logSeverityFilter,
    setLogSeverityFilter,
    followLogs,
    setFollowLogs,
    logsContainerRef,
    fetchStatus,
    handleCancelDeployment,
    handleResumeDeployment,
    handleRetryFailed,
    handleRollback,
    handleVerifyCompletion,
    handleCancelShard,
    handleCancelSelectedShards,
    handleSaveTag,
    fetchEvents,
    fetchLogs,
    fetchReport,
    fetchShardLogs,
    openShardLogs,
    closeShardLogs,
    toggleShardSelection,
    selectAllRunningShards,
    groupShardsByCategory,
    getCategoryStats,
    loadAllShards,
    toggleCategory,
    filteredShards,
    shardsForDisplay,
    displayShards,
    CLASSIFICATION_FILTERS,
  } = dd;
"""


def slice_lines(a: int, b: int) -> str:
    return "\n".join(bak[a - 1 : b]) + "\n"


def write_panel(filename: str, component: str, a: int, b: int) -> None:
    body = slice_lines(a, b)
    body = body.replace(
        "{getStatusBadge(status.status, status.status_detail)}",
        "<DeploymentStatusBadge status={status.status} statusDetail={status.status_detail} />",
    )
    content = (
        HEADER_IMPORTS
        + f"\nexport function {component}() {{\n"
        + "  const dd = useDeploymentDetailsModelContext();\n"
        + DESTRUCTURE
        + "\n  return (\n"
        + body
        + "  );\n}\n"
    )
    (det / filename).write_text(content, encoding="utf-8")
    print(filename, len(content.splitlines()))


def main() -> None:
    write_panel("deployment-details-header.tsx", "DeploymentDetailsHeader", 1240, 1546)
    write_panel(
        "deployment-details-inline-summary.tsx",
        "DeploymentDetailsInlineSummary",
        1548,
        2038,
    )
    write_panel(
        "deployment-details-shards-tab-panel.tsx",
        "DeploymentDetailsShardsTabPanel",
        2075,
        2515,
    )
    write_panel(
        "deployment-details-logs-tab-panel.tsx",
        "DeploymentDetailsLogsTabPanel",
        2517,
        2964,
    )
    write_panel(
        "deployment-details-report-tab-panel.tsx",
        "DeploymentDetailsReportTabPanel",
        2966,
        3140,
    )
    write_panel(
        "deployment-details-events-tab-panel.tsx",
        "DeploymentDetailsEventsTabPanel",
        3142,
        3265,
    )
    write_panel(
        "deployment-details-shard-logs-dialog.tsx",
        "DeploymentDetailsShardLogsDialog",
        3269,
        3369,
    )

    tabs_shell = slice_lines(2041, 2074)
    tabs_file = (
        HEADER_IMPORTS
        + """
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
    events,
    eventsLoading,
    fetchEvents,
  } = dd;
  return (
"""
        + tabs_shell
        + """    <DeploymentDetailsShardsTabPanel />
    <DeploymentDetailsLogsTabPanel />
    <DeploymentDetailsReportTabPanel />
    <DeploymentDetailsEventsTabPanel />
    </Tabs>
  );
}
"""
    )
    (det / "deployment-details-tabs.tsx").write_text(tabs_file, encoding="utf-8")
    print("deployment-details-tabs.tsx", len(tabs_file.splitlines()))

    loaded = '''"use client";

import { Card, CardContent } from "@/components/ui/card";
import { DeploymentDetailsHeader } from "./deployment-details-header";
import { DeploymentDetailsInlineSummary } from "./deployment-details-inline-summary";
import { DeploymentDetailsTabs } from "./deployment-details-tabs";
import { DeploymentDetailsShardLogsDialog } from "./deployment-details-shard-logs-dialog";

export function DeploymentDetailsLoaded() {
  return (
    <Card className="border-2 border-[var(--color-border-emphasis)]">
      <DeploymentDetailsHeader />
      <CardContent className="space-y-4">
        <DeploymentDetailsInlineSummary />
        <DeploymentDetailsTabs />
      </CardContent>
      <DeploymentDetailsShardLogsDialog />
    </Card>
  );
}
'''
    (det / "deployment-details-loaded.tsx").write_text(loaded, encoding="utf-8")
    print("deployment-details-loaded.tsx", len(loaded.splitlines()))


if __name__ == "__main__":
    main()
