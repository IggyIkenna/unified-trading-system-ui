"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, UserPlus, Mail, Shield, Briefcase } from "lucide-react"
import { useOnboardUser } from "@/hooks/api/use-user-management"
import type { ProvisioningRole } from "@/lib/types/user-management"

const INTERNAL_ROLES: { value: ProvisioningRole; label: string }[] = [
  { value: "admin", label: "Admin — full system access" },
  { value: "collaborator", label: "Collaborator — engineering + trading" },
  { value: "operations", label: "Operations — monitoring + ops" },
  { value: "accounting", label: "Accounting — finance + reporting" },
]

const EXTERNAL_ROLES: { value: ProvisioningRole; label: string }[] = [
  { value: "client", label: "Client — standard client access" },
  { value: "board", label: "Board — board-level visibility" },
  { value: "investor", label: "Investor — investor portal" },
  { value: "shareholder", label: "Shareholder — shareholder view" },
]

// Service access — granular entitlements the admin can toggle individually
const SERVICE_ACCESS = [
  {
    category: "Data",
    items: [
      { key: "data-basic", label: "Data (Basic)", desc: "180 CeFi instruments, daily candles" },
      { key: "data-pro", label: "Data (Pro)", desc: "2400+ instruments, CeFi/TradFi/DeFi, tick data, full coverage" },
    ],
  },
  {
    category: "Research & Backtesting",
    items: [
      { key: "ml-full", label: "ML & Models", desc: "Model training, experiments, feature store, deployment" },
      { key: "strategy-full", label: "Strategy Platform", desc: "Backtesting, strategy candidates, comparison, handoff" },
    ],
  },
  {
    category: "Trading & Execution",
    items: [
      { key: "execution-basic", label: "Execution (Basic)", desc: "TWAP, VWAP algos, basic venue routing" },
      { key: "execution-full", label: "Execution (Full)", desc: "All algos, SOR, dark pools, TCA, custom strategies" },
    ],
  },
  {
    category: "Reporting & Regulatory",
    items: [
      { key: "reporting", label: "Reporting & Analytics", desc: "P&L, settlement, reconciliation, regulatory, client reporting" },
    ],
  },
]

// Internal provisioning services — Slack, GitHub, M365, GCP, AWS
const INTERNAL_SERVICES = [
  { key: "slack", label: "Slack" },
  { key: "github", label: "GitHub" },
  { key: "microsoft365", label: "Microsoft 365 (Email)" },
  { key: "gcp", label: "GCP IAM" },
  { key: "aws", label: "AWS IAM" },
]

export default function OnboardUserPage() {
  const router = useRouter()
  const onboard = useOnboardUser()

  // Step 1: Identity
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [userType, setUserType] = React.useState<"internal" | "external">("internal")
  const [role, setRole] = React.useState<ProvisioningRole>("collaborator")

  // Step 2: Auth email (internal only)
  const [createAuthEmail, setCreateAuthEmail] = React.useState(true)
  const [githubHandle, setGithubHandle] = React.useState("")

  // Step 3: Service access (granular)
  const [selectedAccess, setSelectedAccess] = React.useState<string[]>([])

  // Step 4: Internal provisioning
  const [selectedServices, setSelectedServices] = React.useState<string[]>(
    INTERNAL_SERVICES.map((s) => s.key)
  )

  const roles = userType === "internal" ? INTERNAL_ROLES : EXTERNAL_ROLES

  // Auto-set role when switching type
  React.useEffect(() => {
    setRole(userType === "internal" ? "collaborator" : "client")
  }, [userType])

  const toggleAccess = (key: string) => {
    setSelectedAccess((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const toggleService = (key: string) => {
    setSelectedServices((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onboard.mutate(
      {
        name,
        email,
        role,
        github_handle: githubHandle || undefined,
        product_slugs: selectedAccess,
      },
      { onSuccess: () => router.push("/admin/users") }
    )
  }

  return (
    <div className="px-6 py-6 max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/users")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> Onboard User
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Identity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4" /> Identity
              </CardTitle>
              <CardDescription>
                Set up the user&apos;s email. This email propagates to all services
                (Slack, GitHub, GCP, AWS) for internal users.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Jane Smith" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="jane@example.com" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>User Type</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={userType === "internal" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUserType("internal")}
                  >
                    Internal
                  </Button>
                  <Button
                    type="button"
                    variant={userType === "external" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUserType("external")}
                  >
                    External
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as ProvisioningRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {userType === "internal" && (
                <>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="auth-email"
                      checked={createAuthEmail}
                      onCheckedChange={(v) => setCreateAuthEmail(v === true)}
                    />
                    <Label htmlFor="auth-email" className="text-sm cursor-pointer">
                      Create auth email (M365) — use this email for all service provisioning
                    </Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="github">GitHub Handle</Label>
                    <Input
                      id="github"
                      value={githubHandle}
                      onChange={(e) => setGithubHandle(e.target.value)}
                      placeholder="github-username"
                    />
                  </div>
                </>
              )}

              {userType === "external" && (
                <p className="text-xs text-muted-foreground">
                  External users use their existing email for all access. No auth email is created.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Service Access */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4" /> Service Access
              </CardTitle>
              <CardDescription>
                Select which apps and services this user can access.
                Choose individually or select multiple.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {SERVICE_ACCESS.map((cat) => (
                <div key={cat.category}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">{cat.category}</h3>
                  <div className="space-y-2">
                    {cat.items.map((item) => (
                      <div key={item.key} className="flex items-start gap-3 py-1">
                        <Checkbox
                          id={`access-${item.key}`}
                          checked={selectedAccess.includes(item.key)}
                          onCheckedChange={() => toggleAccess(item.key)}
                        />
                        <div>
                          <Label htmlFor={`access-${item.key}`} className="text-sm cursor-pointer font-medium">
                            {item.label}
                          </Label>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Step 3: Internal Provisioning (only for internal) */}
          {userType === "internal" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Internal Provisioning
                </CardTitle>
                <CardDescription>
                  Which internal services to provision. The email above is used for all services.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {INTERNAL_SERVICES.map((svc) => (
                  <div key={svc.key} className="flex items-center gap-3 py-1">
                    <Checkbox
                      id={`svc-${svc.key}`}
                      checked={selectedServices.includes(svc.key)}
                      onCheckedChange={() => toggleService(svc.key)}
                    />
                    <Label htmlFor={`svc-${svc.key}`} className="text-sm cursor-pointer">
                      {svc.label}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Summary + Submit */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm">
                    <span className="font-medium">{name || "—"}</span>
                    <span className="text-muted-foreground ml-2">{email || "—"}</span>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    <Badge variant="outline">{role}</Badge>
                    <Badge variant={userType === "internal" ? "default" : "outline"}>{userType}</Badge>
                    {selectedAccess.map((a) => (
                      <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>
                    ))}
                  </div>
                </div>
                <Button type="submit" disabled={onboard.isPending || !name || !email || selectedAccess.length === 0}>
                  {onboard.isPending ? "Provisioning..." : "Onboard User"}
                </Button>
              </div>
              {onboard.isError && (
                <p className="text-sm text-destructive mt-2">Error: {String(onboard.error)}</p>
              )}
              {onboard.isSuccess && (
                <p className="text-sm text-green-600 mt-2">User onboarded successfully.</p>
              )}
            </CardContent>
          </Card>
        </form>
    </div>
  )
}
