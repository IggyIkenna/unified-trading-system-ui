"use client"

import * as React from "react"
import { RoleLayout } from "@/components/shell/role-layout"
import { AuditDashboard } from "@/components/dashboards/audit-dashboard"

export default function AdminPage() {
  return (
    <RoleLayout currentRole="audit" activeSurface="config" showLifecycleRail={false}>
      <AuditDashboard currentPage="dashboard" />
    </RoleLayout>
  )
}
