"use client";

import { PageHeader } from "@/components/platform/page-header";
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

import dynamic from "next/dynamic";
import { DevOpsDashboard } from "@/components/dashboards/devops-dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Cloud, Database, Rocket, Activity, CheckCircle2, History } from "lucide-react";

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

        <Tabs defaultValue="overview">
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
            <DataStatusTab serviceName="market-tick-data-service" />
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
