"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Search, RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/formatters";

import { MOCK_RUNS } from "@/lib/mocks/fixtures/data-pages";

export default function ETLLogsPage() {
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [dataTypeFilter, setDataTypeFilter] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    let result = MOCK_RUNS;
    if (statusFilter !== "all") result = result.filter((r) => r.status === statusFilter);
    if (dataTypeFilter !== "all") result = result.filter((r) => r.dataType === dataTypeFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) => r.pipeline.includes(q) || r.venue.toLowerCase().includes(q) || r.service.includes(q),
      );
    }
    return result;
  }, [statusFilter, dataTypeFilter, searchQuery]);

  const successCount = MOCK_RUNS.filter((r) => r.status === "success").length;
  const failedCount = MOCK_RUNS.filter((r) => r.status === "failed").length;
  const runningCount = MOCK_RUNS.filter((r) => r.status === "running").length;
  const totalRows = MOCK_RUNS.reduce((s, r) => s + r.rowsProcessed, 0);

  const dataTypes = [...new Set(MOCK_RUNS.map((r) => r.dataType))].sort();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">ETL Pipeline Logs</h2>
          <p className="text-sm text-muted-foreground">
            All data pipeline runs across ingestion, processing, and derived computation
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          <RefreshCw className="size-3.5" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold text-emerald-400">{successCount}</p>
            <p className="text-xs text-muted-foreground">Succeeded</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold text-rose-400">{failedCount}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold text-sky-400">{runningCount}</p>
            <p className="text-xs text-muted-foreground">Running</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-semibold font-mono">{formatNumber(totalRows / 1000000, 1)}M</p>
            <p className="text-xs text-muted-foreground">Rows Processed</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-8 px-2 text-xs rounded-md border border-border bg-background"
        >
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="running">Running</option>
          <option value="warning">Warning</option>
        </select>
        <select
          value={dataTypeFilter}
          onChange={(e) => setDataTypeFilter(e.target.value)}
          className="h-8 px-2 text-xs rounded-md border border-border bg-background"
        >
          <option value="all">All Data Types</option>
          {dataTypes.map((dt) => (
            <option key={dt} value={dt}>
              {dt}
            </option>
          ))}
        </select>
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search pipelines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-48 pl-8 pr-3 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead>Status</TableHead>
                <TableHead>Pipeline</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Data Type</TableHead>
                <TableHead>Started</TableHead>
                <TableHead className="text-right">Duration</TableHead>
                <TableHead className="text-right">Rows</TableHead>
                <TableHead className="text-right">Errors</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id} className={cn("text-xs", r.status === "failed" && "bg-rose-500/5")}>
                  <TableCell>
                    {r.status === "success" ? (
                      <CheckCircle2 className="size-4 text-emerald-400" />
                    ) : r.status === "failed" ? (
                      <XCircle className="size-4 text-rose-400" />
                    ) : r.status === "running" ? (
                      <Clock className="size-4 text-sky-400 animate-pulse" />
                    ) : (
                      <AlertTriangle className="size-4 text-amber-400" />
                    )}
                  </TableCell>
                  <TableCell className="font-mono font-medium">{r.pipeline}</TableCell>
                  <TableCell className="text-muted-foreground">{r.service}</TableCell>
                  <TableCell>{r.venue}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[9px]">
                      {r.dataType}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">{r.startTime.split(" ")[1]}</TableCell>
                  <TableCell className="text-right font-mono">{r.duration}</TableCell>
                  <TableCell className="text-right font-mono">{r.rowsProcessed.toLocaleString()}</TableCell>
                  <TableCell className={cn("text-right font-mono", r.errors > 0 && "text-rose-400")}>
                    {r.errors}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
