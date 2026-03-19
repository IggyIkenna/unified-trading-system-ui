"use client"

import * as React from "react"
import { RoleLayout } from "@/components/shell/role-layout"
import { DevOpsDashboard } from "@/components/dashboards/devops-dashboard"

export default function DevOpsPage() {
  return (
    <RoleLayout currentRole="devops" activeSurface="ops" showLifecycleRail={false}>
      <DevOpsDashboard currentPage="dashboard" />
    </RoleLayout>
  )
}
