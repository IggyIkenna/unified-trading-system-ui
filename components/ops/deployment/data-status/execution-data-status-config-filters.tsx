"use client";

import { CloudConfigBrowser } from "@/components/ops/deployment/CloudConfigBrowser";
import { useExecutionDataStatusContext } from "@/components/ops/deployment/data-status/execution-data-status-context";
import { inferCloudProvider } from "@/components/ops/deployment/data-status/execution-data-status-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Filter, FolderOpen, RefreshCw } from "lucide-react";

export function ExecutionDataStatusConfigFilters() {
  const {
    serviceName,
    cloudConfigPath,
    handleCloudConfigSelected,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    fetchData,
    loading,
  } = useExecutionDataStatusContext();

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-[var(--color-text-muted)]" />
            <CardTitle className="text-base">Config Path</CardTitle>
            {cloudConfigPath && inferCloudProvider(cloudConfigPath) && (
              <Badge variant="outline" className="text-[10px]">
                {inferCloudProvider(cloudConfigPath) === "gcp" ? "GCP" : "AWS"}
              </Badge>
            )}
          </div>
          <CardDescription>Select the cloud config directory (GCS or S3) to check for results</CardDescription>
        </CardHeader>
        <CardContent>
          <CloudConfigBrowser serviceName={serviceName} onPathSelected={handleCloudConfigSelected} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-[var(--color-text-muted)]" />
              <CardTitle className="text-base">Date Range Filter (Optional)</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={() => void fetchData()} disabled={loading || !cloudConfigPath}>
              {loading ? <Spinner className="h-4 w-4 mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Check Status
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">
                Start Date (filter results)
              </Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9" />
            </div>
            <div>
              <Label className="text-xs font-medium text-[var(--color-text-muted)] mb-1 block">
                End Date (filter results)
              </Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9" />
            </div>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-2">
            Filter which result dates to check. Leave as-is to check all available dates.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
