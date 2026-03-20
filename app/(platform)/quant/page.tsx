"use client"

import * as React from "react"
import { RoleLayout } from "@/components/shell/role-layout"
import { QuantDashboard } from "@/components/dashboards/quant-dashboard"

export default function QuantPage() {
  return (
    <RoleLayout currentRole="quant" activeSurface="ml" showLifecycleRail={true}>
      <QuantDashboard currentPage="dashboard" />
    </RoleLayout>
  )
}
