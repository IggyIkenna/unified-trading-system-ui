"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, UserPlus } from "lucide-react"
import { useOnboardUser, useAccessTemplates } from "@/hooks/api/use-user-management"
import type { ProvisioningRole } from "@/lib/types/user-management"

const ROLES: ProvisioningRole[] = [
  "admin", "collaborator", "board", "client", "shareholder", "accounting", "operations", "investor"
]

export default function OnboardUserPage() {
  const router = useRouter()
  const onboard = useOnboardUser()
  const templates = useAccessTemplates()
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [role, setRole] = React.useState<ProvisioningRole>("collaborator")
  const [githubHandle, setGithubHandle] = React.useState("")
  const [templateId, setTemplateId] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onboard.mutate(
      {
        name,
        email,
        role,
        github_handle: githubHandle || undefined,
        product_slugs: [],
        access_template_id: templateId || undefined,
      },
      { onSuccess: () => router.push("/admin/users") }
    )
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/users")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserPlus className="h-6 w-6" /> Onboard User
        </h1>
      </div>

      <Card>
        <CardHeader><CardTitle>New User</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as ProvisioningRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="github">GitHub Handle (optional)</Label>
              <Input id="github" value={githubHandle} onChange={(e) => setGithubHandle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Access Template (optional)</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  {(templates.data?.templates ?? []).map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={onboard.isPending || !name || !email}>
              {onboard.isPending ? "Onboarding..." : "Onboard User"}
            </Button>
            {onboard.isError && (
              <p className="text-sm text-destructive">Error: {String(onboard.error)}</p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
