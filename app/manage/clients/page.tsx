"use client"

/**
 * Manage > Clients Page
 * 
 * Client/Organisation oversight - one of the high-value Manage pages.
 * Lifecycle Stage: Manage
 * Domain Lanes: Capital
 */

import * as React from "react"
import { GlobalNavBar } from "@/components/trading/global-nav-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Building2,
  Search,
  Filter,
  MoreHorizontal,
  Plus,
  Users,
  DollarSign,
  TrendingUp,
  Shield,
  FileText,
  Settings,
  Eye,
  Mail,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Mock client data
const clients = [
  {
    id: "cli-001",
    name: "Alpha Capital Partners",
    type: "institutional",
    tier: "full-platform",
    status: "active",
    aum: 12500000,
    strategies: 4,
    mandates: 2,
    users: 8,
    onboardedAt: "2025-06-15",
    lastActivity: "2026-03-18",
    primaryContact: "james.wilson@alphacap.com",
    feeStructure: "0% + 20%",
    compliance: "compliant",
  },
  {
    id: "cli-002",
    name: "Nordic Quant Fund",
    type: "institutional",
    tier: "execution-only",
    status: "active",
    aum: 8200000,
    strategies: 0,
    mandates: 1,
    users: 3,
    onboardedAt: "2025-09-01",
    lastActivity: "2026-03-17",
    primaryContact: "erik.larsson@nordicquant.se",
    feeStructure: "30% alpha",
    compliance: "compliant",
  },
  {
    id: "cli-003",
    name: "Meridian Research",
    type: "research",
    tier: "data-only",
    status: "active",
    aum: 0,
    strategies: 0,
    mandates: 0,
    users: 5,
    onboardedAt: "2025-11-20",
    lastActivity: "2026-03-16",
    primaryContact: "sarah.chen@meridian.io",
    feeStructure: "$499/mo",
    compliance: "compliant",
  },
  {
    id: "cli-004",
    name: "Vertex Trading Ltd",
    type: "ar-client",
    tier: "regulatory",
    status: "active",
    aum: 0,
    strategies: 12,
    mandates: 0,
    users: 15,
    onboardedAt: "2026-01-10",
    lastActivity: "2026-03-18",
    primaryContact: "michael.brown@vertex.co.uk",
    feeStructure: "GBP 4k/mo",
    compliance: "under-review",
  },
  {
    id: "cli-005",
    name: "Pacific Investments",
    type: "institutional",
    tier: "investment-mgmt",
    status: "onboarding",
    aum: 5000000,
    strategies: 0,
    mandates: 1,
    users: 2,
    onboardedAt: "2026-03-01",
    lastActivity: "2026-03-15",
    primaryContact: "david.lee@pacificinv.com",
    feeStructure: "0% + 35%",
    compliance: "pending",
  },
]

const tierLabels: Record<string, { label: string; color: string }> = {
  "full-platform": { label: "Full Platform", color: "text-violet-400 bg-violet-400/10 border-violet-400/30" },
  "execution-only": { label: "Execution", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" },
  "data-only": { label: "Data", color: "text-sky-400 bg-sky-400/10 border-sky-400/30" },
  "regulatory": { label: "AR Client", color: "text-amber-400 bg-amber-400/10 border-amber-400/30" },
  "investment-mgmt": { label: "Investment", color: "text-rose-400 bg-rose-400/10 border-rose-400/30" },
}

const statusLabels: Record<string, { label: string; color: string }> = {
  "active": { label: "Active", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" },
  "onboarding": { label: "Onboarding", color: "text-amber-400 bg-amber-400/10 border-amber-400/30" },
  "suspended": { label: "Suspended", color: "text-destructive bg-destructive/10 border-destructive/30" },
}

const complianceLabels: Record<string, { label: string; color: string }> = {
  "compliant": { label: "Compliant", color: "text-emerald-400" },
  "under-review": { label: "Under Review", color: "text-amber-400" },
  "pending": { label: "Pending", color: "text-muted-foreground" },
  "issue": { label: "Issue", color: "text-destructive" },
}

function formatCurrency(value: number): string {
  if (value === 0) return "-"
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
  return `$${value}`
}

export default function ManageClientsPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.primaryContact.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  // Summary stats
  const totalAUM = clients.reduce((sum, c) => sum + c.aum, 0)
  const activeClients = clients.filter(c => c.status === "active").length
  const totalUsers = clients.reduce((sum, c) => sum + c.users, 0)

  return (
    <div className="min-h-screen bg-background">
      <GlobalNavBar />
      
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Clients & Organisations</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage client relationships, mandates, and access entitlements
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="size-4" />
            Add Client
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="size-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{clients.length}</div>
                  <div className="text-xs text-muted-foreground">Total Clients</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-400/10">
                  <TrendingUp className="size-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{activeClients}</div>
                  <div className="text-xs text-muted-foreground">Active</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-400/10">
                  <DollarSign className="size-5 text-violet-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{formatCurrency(totalAUM)}</div>
                  <div className="text-xs text-muted-foreground">Total AUM</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-sky-400/10">
                  <Users className="size-5 text-sky-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalUsers}</div>
                  <div className="text-xs text-muted-foreground">Total Users</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Client Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Client Directory</CardTitle>
                <CardDescription>All clients and their access entitlements</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search clients..."
                    className="pl-9 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="size-4" />
                  Filter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">AUM</TableHead>
                  <TableHead className="text-center">Users</TableHead>
                  <TableHead>Fee Structure</TableHead>
                  <TableHead>Compliance</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => {
                  const tier = tierLabels[client.tier]
                  const status = statusLabels[client.status]
                  const compliance = complianceLabels[client.compliance]
                  
                  return (
                    <TableRow key={client.id} className="group">
                      <TableCell>
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-xs text-muted-foreground">{client.primaryContact}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-xs", tier.color)}>
                          {tier.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-xs", status.color)}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(client.aum)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="size-3 text-muted-foreground" />
                          {client.users}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {client.feeStructure}
                      </TableCell>
                      <TableCell>
                        <div className={cn("flex items-center gap-1 text-xs", compliance.color)}>
                          <Shield className="size-3" />
                          {compliance.label}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8 opacity-0 group-hover:opacity-100">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Eye className="mr-2 size-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FileText className="mr-2 size-4" />
                              View Mandates
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="mr-2 size-4" />
                              Contact
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Settings className="mr-2 size-4" />
                              Manage Access
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
