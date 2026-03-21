"use client"

import * as React from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Building2, Plus, ArrowLeft, Users, Key, Database, CreditCard,
  BarChart3,
} from "lucide-react"
interface Organization {
  id: string; name: string; type: string; status: string; memberCount: number;
  subscriptionTier: string; createdAt: string; monthlyFee: number;
  apiKeys?: number; usageGb?: number
}
interface Subscription {
  orgId: string; tier: string; entitlements: string[]; startDate: string; renewalDate: string; monthlyFee: number;
  managementFeePct?: number; performanceFeePct?: number; dataFeePct?: number; aumUsd?: number
}

const INITIAL_ORGS: Organization[] = [
  { id: "odum-internal", name: "Odum Research", type: "internal", status: "active", memberCount: 12, subscriptionTier: "full-platform", createdAt: "2024-01-01", monthlyFee: 0 },
  { id: "acme", name: "Alpha Capital", type: "client", status: "active", memberCount: 5, subscriptionTier: "execution-full", createdAt: "2025-06-15", monthlyFee: 25000 },
  { id: "beta", name: "Beta Fund", type: "client", status: "active", memberCount: 2, subscriptionTier: "data-basic", createdAt: "2026-01-10", monthlyFee: 2500 },
  { id: "vertex", name: "Vertex Partners", type: "client", status: "onboarding", memberCount: 1, subscriptionTier: "data-pro", createdAt: "2026-03-01", monthlyFee: 8000 },
]
const INITIAL_SUBS: Subscription[] = [
  { orgId: "acme", tier: "execution-full", entitlements: ["data-pro", "execution-full", "ml-full", "strategy-full", "reporting"], startDate: "2025-06-15", renewalDate: "2026-06-15", monthlyFee: 25000 },
  { orgId: "beta", tier: "data-basic", entitlements: ["data-basic"], startDate: "2026-01-10", renewalDate: "2027-01-10", monthlyFee: 2500 },
  { orgId: "vertex", tier: "data-pro", entitlements: ["data-pro"], startDate: "2026-03-01", renewalDate: "2027-03-01", monthlyFee: 8000 },
]

const TIERS = ["starter", "professional", "institutional", "enterprise"] as const

export default function ClientsManagementPage() {
  const [orgs, setOrgs] = React.useState<Organization[]>(INITIAL_ORGS)
  const [subscriptions, setSubscriptions] = React.useState<Subscription[]>(INITIAL_SUBS)
  const addOrg = (org: Organization) => setOrgs((prev) => [...prev, org])
  const updateOrg = (id: string, updates: Partial<Organization>) => setOrgs((prev) => prev.map((o) => o.id === id ? { ...o, ...updates } : o))
  const updateSubscription = (orgId: string, updates: Partial<Subscription>) => setSubscriptions((prev) => prev.map((s) => s.orgId === orgId ? { ...s, ...updates } : s))
  const addSubscription = (sub: Subscription) => setSubscriptions((prev) => [...prev, sub])
  const [selectedOrgId, setSelectedOrgId] = React.useState<string | null>(null)
  const [createOpen, setCreateOpen] = React.useState(false)

  // Create form state
  const [newName, setNewName] = React.useState("")
  const [newType, setNewType] = React.useState<"internal" | "client">("client")
  const [newTier, setNewTier] = React.useState<typeof TIERS[number]>("professional")

  const selectedOrg = orgs.find((o) => o.id === selectedOrgId)
  const selectedSub = subscriptions.find((s) => s.orgId === selectedOrgId)

  function handleCreateOrg() {
    if (!newName.trim()) {
      toast.error("Organization name is required")
      return
    }
    const id = `org-${String(Date.now()).slice(-6)}`
    const monthlyFee =
      newTier === "starter" ? 1500
        : newTier === "professional" ? 5500
          : newTier === "institutional" ? 15000
            : 25000

    const org: Organization = {
      id,
      name: newName.trim(),
      type: newType,
      status: "onboarding",
      memberCount: 0,
      subscriptionTier: newTier,
      monthlyFee,
      apiKeys: 0,
      usageGb: 0,
      createdAt: new Date().toISOString().split("T")[0],
    }
    addOrg(org)
    addSubscription({
      orgId: id,
      tier: newTier,
      entitlements: ["data-basic"],
      startDate: new Date().toISOString().split("T")[0],
      renewalDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
      monthlyFee,
      managementFeePct: newTier === "enterprise" ? 1.0 : newTier === "institutional" ? 1.5 : 2.0,
      performanceFeePct: 20,
      dataFeePct: 0.05,
      aumUsd: 0,
    })
    toast.success("Organization created", {
      description: `${org.name} added as ${org.type} (${org.subscriptionTier})`,
    })
    setNewName("")
    setNewType("client")
    setNewTier("professional")
    setCreateOpen(false)
  }

  function handleTierChange(orgId: string, tier: typeof TIERS[number]) {
    const monthlyFee =
      tier === "starter" ? 1500
        : tier === "professional" ? 5500
          : tier === "institutional" ? 15000
            : 25000
    updateOrg(orgId, { subscriptionTier: tier, monthlyFee })
    updateSubscription(orgId, { tier, monthlyFee })
    const org = orgs.find((o) => o.id === orgId)
    toast.success("Subscription updated", {
      description: `${org?.name} moved to ${tier}`,
    })
  }

  // Detail view
  if (selectedOrg) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border">
          <div className="container px-4 py-6 md:px-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedOrgId(null)}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 size-4" />
              Back to Clients
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{selectedOrg.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedOrg.type === "internal" ? "Internal Team" : "Client Organization"} — Created {selectedOrg.createdAt}
                </p>
              </div>
              <Badge
                className={
                  selectedOrg.status === "active"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : selectedOrg.status === "onboarding"
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-red-500/20 text-red-400"
                }
              >
                {selectedOrg.status}
              </Badge>
            </div>
          </div>
        </div>

        <div className="container px-4 py-8 md:px-6">
          <Tabs defaultValue="overview">
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
              <TabsTrigger value="usage">API & Usage</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-sky-500/10 p-2.5">
                        <Users className="size-5 text-sky-400" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Members</p>
                        <p className="text-xl font-bold font-mono">{selectedOrg.memberCount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-emerald-500/10 p-2.5">
                        <CreditCard className="size-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Tier</p>
                        <p className="text-xl font-bold capitalize">{selectedOrg.subscriptionTier}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-amber-500/10 p-2.5">
                        <Key className="size-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">API Keys</p>
                        <p className="text-xl font-bold font-mono">{selectedOrg.apiKeys}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-violet-500/10 p-2.5">
                        <Database className="size-5 text-violet-400" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Usage</p>
                        <p className="text-xl font-bold font-mono">{selectedOrg.usageGb} GB</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Organization Members</CardTitle>
                  <CardDescription>
                    {selectedOrg.memberCount} member{selectedOrg.memberCount !== 1 ? "s" : ""} in {selectedOrg.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedOrg.memberCount === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No members yet. Invite users from the User Management page.
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Visit User Management to manage members for this organization.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscription">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Subscription Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Current Tier</p>
                      <Select
                        value={selectedOrg.subscriptionTier}
                        onValueChange={(val) => handleTierChange(selectedOrg.id, val as typeof TIERS[number])}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIERS.map((t) => (
                            <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Monthly Fee</p>
                      <p className="text-lg font-bold font-mono">${selectedOrg.monthlyFee.toLocaleString()}</p>
                    </div>
                    {selectedSub && (
                      <>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Management Fee</p>
                          <p className="text-lg font-bold font-mono">{selectedSub.managementFeePct}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">AUM</p>
                          <p className="text-lg font-bold font-mono">
                            ${((selectedSub?.aumUsd ?? 0) / 1_000_000).toFixed(1)}M
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="usage">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">API Keys & Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Key className="size-4 text-amber-400" />
                        <p className="text-sm font-medium">Active API Keys</p>
                      </div>
                      <p className="text-2xl font-bold font-mono">{selectedOrg.apiKeys}</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="size-4 text-sky-400" />
                        <p className="text-sm font-medium">Data Usage (this month)</p>
                      </div>
                      <p className="text-2xl font-bold font-mono">{selectedOrg.usageGb} GB</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    )
  }

  // List view
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="container px-4 py-6 md:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Client Management</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage client organizations, subscriptions, and access
              </p>
            </div>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 size-4" />
                  Create Org
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Organization</DialogTitle>
                  <DialogDescription>
                    Add a new organization to the platform.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Organization Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      placeholder="e.g. Apex Trading Group"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Type</label>
                    <Select value={newType} onValueChange={(v) => setNewType(v as "internal" | "client")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="internal">Internal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subscription Tier</label>
                    <Select value={newTier} onValueChange={(v) => setNewTier(v as typeof TIERS[number])}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIERS.map((t) => (
                          <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateOrg}>
                    Create Organization
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="container px-4 py-8 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orgs.map((org) => {
            const sub = subscriptions.find((s) => s.orgId === org.id)
            return (
              <Card
                key={org.id}
                className="cursor-pointer hover:border-foreground/20 transition-colors"
                onClick={() => setSelectedOrgId(org.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="size-4 text-muted-foreground" />
                      <CardTitle className="text-base">{org.name}</CardTitle>
                    </div>
                    <Badge
                      className={
                        org.status === "active"
                          ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                          : org.status === "onboarding"
                            ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                            : "bg-red-500/20 text-red-400"
                      }
                    >
                      {org.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {org.type === "internal" ? "Internal" : "Client"} — {org.memberCount} members
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Tier</p>
                      <p className="font-medium capitalize">{org.subscriptionTier}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Monthly</p>
                      <p className="font-mono font-medium">${org.monthlyFee.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Usage</p>
                      <p className="font-mono font-medium">{org.usageGb} GB</p>
                    </div>
                  </div>
                  {sub && (sub.aumUsd ?? 0) > 0 && (
                    <div className="text-xs text-muted-foreground">
                      AUM: ${((sub.aumUsd ?? 0) / 1_000_000).toFixed(1)}M — Mgmt: {sub.managementFeePct}% — Perf: {sub.performanceFeePct}%
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
