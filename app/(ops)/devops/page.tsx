"use client"

/**
 * /devops — Deployment control center.
 * Overview tab: existing DevOpsDashboard (779 lines)
 * Sub-routes: /devops/deployments, /devops/data-status, /devops/builds, /devops/services, /devops/readiness
 * These will be wired to the ported deployment-ui components.
 */

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { DevOpsDashboard } from "@/components/dashboards/devops-dashboard"
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
            <div className="text-center py-12 text-muted-foreground">
              <Rocket className="size-12 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-semibold mb-2">Deployment History & Management</h3>
              <p className="text-sm">
                Create deployments, track shard progress, retry failed shards, rollback.
              </p>
              <Badge variant="outline" className="mt-4">Ported from unified-trading-deployment-ui</Badge>
            </div>
          </TabsContent>

          <TabsContent value="data-status">
            <div className="text-center py-12 text-muted-foreground">
              <Database className="size-12 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-semibold mb-2">Data Completeness & Freshness</h3>
              <p className="text-sm">
                Heatmap calendar, venue drill-down, coverage percentage, deploy missing shards.
              </p>
              <Badge variant="outline" className="mt-4">Ported from unified-trading-deployment-ui</Badge>
            </div>
          </TabsContent>

          <TabsContent value="builds">
            <div className="text-center py-12 text-muted-foreground">
              <Cloud className="size-12 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-semibold mb-2">Cloud Build Triggers & History</h3>
              <p className="text-sm">
                Trigger builds, view build logs, monitor CI/CD pipeline status.
              </p>
              <Badge variant="outline" className="mt-4">Ported from unified-trading-deployment-ui</Badge>
            </div>
          </TabsContent>

          <TabsContent value="services">
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="size-12 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-semibold mb-2">Service Inventory & Health</h3>
              <p className="text-sm">
                All services with version, status, sharding config, last deployment.
              </p>
              <Badge variant="outline" className="mt-4">Ported from unified-trading-deployment-ui</Badge>
            </div>
          </TabsContent>

          <TabsContent value="readiness">
            <div className="text-center py-12 text-muted-foreground">
              <History className="size-12 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-semibold mb-2">Epic Readiness & Feature Tracking</h3>
              <p className="text-sm">
                Service readiness scorecard, repo-level tier tracking, feature dependencies.
              </p>
              <Badge variant="outline" className="mt-4">Ported from unified-trading-deployment-ui</Badge>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
