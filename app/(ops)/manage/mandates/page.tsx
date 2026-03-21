"use client"

/**
 * Manage > Mandates Page (Stub)
 * 
 * Investment mandates, allocations, and oversight.
 * Lifecycle Stage: Manage
 * Domain Lanes: Capital, Compliance
 * 
 * TODO: Build out full functionality
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Target, Shield, DollarSign } from "lucide-react"

export default function ManageMandatesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Investment Mandates</h1>
            <Badge variant="outline" className="text-amber-400 border-amber-400/30">Coming Soon</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage investment mandates, allocation limits, and compliance boundaries
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="size-5 text-primary" />
                Mandate Configuration
              </CardTitle>
              <CardDescription>
                Define allocation targets, risk limits, and investment guidelines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                This section will allow you to create and manage investment mandates for each client, 
                including asset class allocations, position limits, and drawdown thresholds.
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="size-5 text-primary" />
                Compliance Monitoring
              </CardTitle>
              <CardDescription>
                Track mandate adherence and flag breaches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Real-time monitoring of mandate compliance, automatic breach alerts, 
                and historical compliance reporting.
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="size-5 text-primary" />
                Allocation Tracking
              </CardTitle>
              <CardDescription>
                Current vs target allocations across client portfolios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Visual breakdown of actual allocations against mandate targets, 
                with rebalancing recommendations and drift analysis.
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                Mandate Documentation
              </CardTitle>
              <CardDescription>
                Signed agreements and change history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Document storage for IMA agreements, mandate amendments, 
                and a full audit trail of all changes.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
