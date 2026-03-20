"use client"

import * as React from "react"
import { RoleLayout } from "@/components/shell/role-layout"
import { ExecutiveDashboard } from "@/components/dashboards/executive-dashboard"

export default function ExecutivePage() {
  return (
    <RoleLayout currentRole="executive" activeSurface="reports" showLifecycleRail={false}>
      <ExecutiveDashboard currentPage="dashboard" />
    </RoleLayout>
  )
}
