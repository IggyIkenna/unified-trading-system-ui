"use client";

import { useTabParam } from "@/hooks/use-tab-param";
import { PageHeader } from "@/components/shared/page-header";
/**
 * /devops — Deployment control center.
 * Tabbed interface with components ported from unified-trading-deployment-ui.
 * Overview: existing DevOpsDashboard (779 lines)
 * Deployments: DeploymentHistory + DeployForm
 * Data Status: DataStatusTab (4013 lines — heatmap calendar, drill-down)
 * Cloud Builds: CloudBuildsTab
 * Services: ServicesOverviewTab + ServiceStatusTab
 * Readiness: ReadinessTab + EpicReadinessView
 */

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { DevOpsDashboard } from "@/components/dashboards/devops-dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Cloud, Database, Rocket, Activity, CheckCircle2, History } from "lucide-react";
import { deployMissing, type DeployMissingResponse } from "@/hooks/deployment/_api-stub";
import type { DataStatusTabProps } from "@/components/ops/deployment/data-status/types";

function TabSkeleton() {
  return (
    <div className="space-y-4 py-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  );
}

const DeploymentHistory = dynamic(
  () => import("@/components/ops/deployment/DeploymentHistory").then((m) => m.DeploymentHistory),
  { ssr: false, loading: () => <TabSkeleton /> },
);
const DataStatusTab = dynamic(() => import("@/components/ops/deployment/DataStatusTab").then((m) => m.DataStatusTab), {
  ssr: false,
  loading: () => <TabSkeleton />,
});
const CloudBuildsTab = dynamic(
  () => import("@/components/ops/deployment/CloudBuildsTab").then((m) => m.CloudBuildsTab),
  { ssr: false, loading: () => <TabSkeleton /> },
);
const ServicesOverviewTab = dynamic(
  () => import("@/components/ops/deployment/ServicesOverviewTab").then((m) => m.ServicesOverviewTab),
  { ssr: false, loading: () => <TabSkeleton /> },
);
const ReadinessTab = dynamic(() => import("@/components/ops/deployment/ReadinessTab").then((m) => m.ReadinessTab), {
  ssr: false,
  loading: () => <TabSkeleton />,
});

export default function DevOpsPage() {
  const [devopsTab, setDevopsTab] = useTabParam("overview");
  const [deployMissingResult, setDeployMissingResult] = useState<DeployMissingResponse | null>(null);
  const [deployMissingError, setDeployMissingError] = useState<string | null>(null);
  const [isDeployingMissing, setIsDeployingMissing] = useState(false);

  const handleDeployMissing: NonNullable<DataStatusTabProps["onDeployMissing"]> = useCallback(
    async (params) => {
      setDeployMissingError(null);
      setDeployMissingResult(null);
      setIsDeployingMissing(true);
      try {
        const result = await deployMissing({
          service: params.service,
          start_date: params.start_date,
          end_date: params.end_date,
          region: params.region,
          categories: params.categories,
          venues: params.venues,
          folders: params.folders,
          data_types: params.data_types,
          force: params.force,
          dry_run: params.dry_run,
          skip_existing: params.skip_existing,
          exclude_dates: params.exclude_dates,
          date_granularity: params.date_granularity,
          deploy_missing_only: params.deploy_missing_only,
          first_day_of_month_only: params.first_day_of_month_only,
          mode: params.mode,
        });
        setDeployMissingResult(result);
      } catch (err) {
        setDeployMissingError(err instanceof Error ? err.message : "Deploy-missing request failed");
      } finally {
        setIsDeployingMissing(false);
      }
    },
    [],
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-8 md:px-6">
        <div className="flex items-center justify-between mb-6">
          <PageHeader
            title="Deployment Control Center"
            description="Service deployments, data pipelines, cloud builds, and
              infrastructure readiness."
          />
          <Badge variant="outline" className="text-xs">
            <Activity className="size-3 mr-1" /> All systems operational
          </Badge>
        </div>

        {deployMissingError && (
          <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <strong>Deploy-missing error:</strong> {deployMissingError}
          </div>
        )}

        {deployMissingResult && (
          <div className="mb-4 rounded-md border border-border bg-muted/50 px-4 py-3 text-sm">
            <strong>{deployMissingResult.dry_run ? "Preview" : "Deployment"}:</strong>{" "}
            {deployMissingResult.missing_analysis.total_missing} missing shards for{" "}
            {deployMissingResult.missing_analysis.service}
            {deployMissingResult.missing_analysis.summary && (
              <span>
                {" "}
                ({deployMissingResult.missing_analysis.summary.days_with_missing}/
                {deployMissingResult.missing_analysis.summary.total_days_checked} days,{" "}
                {(deployMissingResult.missing_analysis.summary.completion_rate * 100).toFixed(1)}% complete)
              </span>
            )}
            {deployMissingResult.deployment && (
              <span className="ml-2 text-muted-foreground">
                Deployment ID: {deployMissingResult.deployment.deployment_id} ({deployMissingResult.deployment.status})
              </span>
            )}
          </div>
        )}

        <Tabs value={devopsTab} onValueChange={setDevopsTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">
              <Activity className="mr-2 size-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="deployments">
              <Rocket className="mr-2 size-4" />
              Deployments
            </TabsTrigger>
            <TabsTrigger value="data-status">
              <Database className="mr-2 size-4" />
              Data Status
            </TabsTrigger>
            <TabsTrigger value="builds">
              <Cloud className="mr-2 size-4" />
              Cloud Builds
            </TabsTrigger>
            <TabsTrigger value="services">
              <CheckCircle2 className="mr-2 size-4" />
              Services
            </TabsTrigger>
            <TabsTrigger value="readiness">
              <History className="mr-2 size-4" />
              Readiness
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <DevOpsDashboard currentPage="dashboard" />
          </TabsContent>

          <TabsContent value="deployments">
            <DeploymentHistory />
          </TabsContent>

          <TabsContent value="data-status">
            <DataStatusTab
              serviceName="market-tick-data-service"
              isDeploying={isDeployingMissing}
              onDeployMissing={handleDeployMissing}
            />
          </TabsContent>

          <TabsContent value="builds">
            <CloudBuildsTab />
          </TabsContent>

          <TabsContent value="services">
            <ServicesOverviewTab />
          </TabsContent>

          <TabsContent value="readiness">
            <ReadinessTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
