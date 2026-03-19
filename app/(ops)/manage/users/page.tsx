"use client"

/**
 * Manage > Users Page (Stub)
 * 
 * User and permission management.
 * Lifecycle Stage: Manage
 * Domain Lanes: Compliance
 * 
 * TODO: Build out full functionality
 */

import { GlobalNavBar } from "@/components/trading/global-nav-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Key, Shield, History } from "lucide-react"

export default function ManageUsersPage() {
  return (
    <div className="min-h-screen bg-background">
      <GlobalNavBar />
      
      <div className="p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">User Management</h1>
            <Badge variant="outline" className="text-amber-400 border-amber-400/30">Coming Soon</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage users, roles, permissions, and access controls
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5 text-primary" />
                User Directory
              </CardTitle>
              <CardDescription>
                All users across internal and client organisations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Comprehensive user list with organisation affiliation, role assignments, 
                and activity status. Supports multi-org users.
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="size-5 text-primary" />
                Role & Permissions
              </CardTitle>
              <CardDescription>
                Define roles and their lifecycle stage access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Role-based access control mapping to lifecycle stages: 
                Acquire, Build, Promote, Run, Observe, Manage, Report.
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="size-5 text-primary" />
                Entitlements
              </CardTitle>
              <CardDescription>
                Data and feature entitlement management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Fine-grained control over data access, alpha exposure boundaries, 
                and feature entitlements per user or organisation.
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="size-5 text-primary" />
                Audit Trail
              </CardTitle>
              <CardDescription>
                User activity and permission change history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Complete audit trail of user actions, login history, 
                and all permission/entitlement changes for compliance.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
