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
import { ArrowLeft, UserPlus, Mail, Shield, Briefcase, ChevronRight, ChevronDown, Lock } from "lucide-react"
import { useOnboardUser, usePermissionCatalogue } from "@/hooks/api/use-user-management"
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
  const { data: catalogueData, isLoading: catalogueLoading } = usePermissionCatalogue()

  // Step 1: Identity
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [userType, setUserType] = React.useState<"internal" | "external">("internal")
  const [role, setRole] = React.useState<ProvisioningRole>("collaborator")

  // Step 2: Auth email (internal only)
  const [createAuthEmail, setCreateAuthEmail] = React.useState(true)
  const [githubHandle, setGithubHandle] = React.useState("")

  // Step 3: Service access (granular) — driven by catalogue
  const [selectedAccess, setSelectedAccess] = React.useState<string[]>([])
  const [expandedDomains, setExpandedDomains] = React.useState<Set<string>>(new Set())
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(new Set())

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

  const toggleDomain = (key: string) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleCategory = (domainKey: string, catKey: string) => {
    const compositeKey = `${domainKey}:${catKey}`
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(compositeKey)) next.delete(compositeKey)
      else next.add(compositeKey)
      return next
    })
  }

  // Filter domains: hide internal-services for external users
  const domains = (catalogueData?.domains ?? []).filter(
    (d) => userType === "internal" || !d.categories.every((c) => c.permissions.every((p) => p.internal_only))
  )

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

          {/* Step 2: Service Access — catalogue-driven */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4" /> Service Access
              </CardTitle>
              <CardDescription>
                Select which apps and services this user can access.
                Expand domains and categories to pick individual permissions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {catalogueLoading ? (
                <p className="text-sm text-muted-foreground">Loading catalogue...</p>
              ) : (
                domains.map((domain) => {
                  const isDomainExpanded = expandedDomains.has(domain.key)
                  // Count selected permissions in this domain
                  const domainSelectedCount = domain.categories.reduce(
                    (sum, cat) => sum + cat.permissions.filter((p) => selectedAccess.includes(p.key)).length,
                    0
                  )
                  return (
                    <div key={domain.key} className="border rounded-md">
                      <button
                        type="button"
                        onClick={() => toggleDomain(domain.key)}
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2">
                          {isDomainExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          <span className="text-sm font-medium">{domain.label}</span>
                          <span className="text-xs text-muted-foreground">{domain.description}</span>
                        </div>
                        {domainSelectedCount > 0 && (
                          <Badge variant="default" className="text-xs">{domainSelectedCount} selected</Badge>
                        )}
                      </button>
                      {isDomainExpanded && (
                        <div className="px-3 pb-3 space-y-2">
                          {domain.categories.map((cat) => {
                            const compositeKey = `${domain.key}:${cat.key}`
                            const isCatExpanded = expandedCategories.has(compositeKey)
                            // Filter out internal_only permissions for external users
                            const visiblePerms = userType === "internal"
                              ? cat.permissions
                              : cat.permissions.filter((p) => !p.internal_only)
                            if (visiblePerms.length === 0) return null
                            return (
                              <div key={cat.key} className="ml-4">
                                <button
                                  type="button"
                                  onClick={() => toggleCategory(domain.key, cat.key)}
                                  className="w-full flex items-center gap-2 py-1 text-sm hover:bg-muted/30 rounded px-2 transition-colors text-left"
                                >
                                  {isCatExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                  <span className="font-medium">{cat.label}</span>
                                  <span className="text-xs text-muted-foreground">({visiblePerms.length})</span>
                                </button>
                                {isCatExpanded && (
                                  <div className="ml-5 space-y-1 pb-1">
                                    {visiblePerms.map((perm) => (
                                      <div key={perm.key} className="flex items-start gap-3 py-1">
                                        <Checkbox
                                          id={`access-${domain.key}-${cat.key}-${perm.key}`}
                                          checked={selectedAccess.includes(perm.key)}
                                          onCheckedChange={() => toggleAccess(perm.key)}
                                        />
                                        <div>
                                          <Label
                                            htmlFor={`access-${domain.key}-${cat.key}-${perm.key}`}
                                            className="text-sm cursor-pointer font-medium flex items-center gap-1"
                                          >
                                            {perm.label}
                                            {perm.internal_only && <Lock className="h-3 w-3 text-muted-foreground" />}
                                          </Label>
                                          <p className="text-xs text-muted-foreground">{perm.description}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
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
