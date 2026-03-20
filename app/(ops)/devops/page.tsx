"use client"

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

import * as React from "react"
import { DevOpsDashboard } from "@/components/dashboards/devops-dashboard"
import { DeploymentHistory } from "@/components/ops/deployment/DeploymentHistory"
import { DataStatusTab } from "@/components/ops/deployment/DataStatusTab"
import { CloudBuildsTab } from "@/components/ops/deployment/CloudBuildsTab"
import { ServicesOverviewTab } from "@/components/ops/deployment/ServicesOverviewTab"
import { ReadinessTab } from "@/components/ops/deployment/ReadinessTab"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Cloud, Database, Rocket, Activity, CheckCircle2, History,
} from "lucide-react"

export default function DevOpsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-8 md:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Deployment Control Center</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Service deployments, data pipelines, cloud builds, and infrastructure readiness.
            </p>
          </div>
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
            <React.Suspense fallback={<div className="py-12 text-center text-muted-foreground">Loading deployments...</div>}>
              <DeploymentHistory />
            </React.Suspense>
          </TabsContent>

          <TabsContent value="data-status">
            <React.Suspense fallback={<div className="py-12 text-center text-muted-foreground">Loading data status...</div>}>
              <DataStatusTab serviceName="market-tick-data-service" />
            </React.Suspense>
          </TabsContent>

          <TabsContent value="builds">
            <React.Suspense fallback={<div className="py-12 text-center text-muted-foreground">Loading builds...</div>}>
              <CloudBuildsTab />
            </React.Suspense>
          </TabsContent>

          <TabsContent value="services">
            <React.Suspense fallback={<div className="py-12 text-center text-muted-foreground">Loading services...</div>}>
              <ServicesOverviewTab />
            </React.Suspense>
          </TabsContent>

          <TabsContent value="readiness">
            <React.Suspense fallback={<div className="py-12 text-center text-muted-foreground">Loading readiness...</div>}>
              <ReadinessTab />
            </React.Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
