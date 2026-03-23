"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save } from "lucide-react"
import { useProvisionedUser, useModifyUser, useAccessTemplates } from "@/hooks/api/use-user-management"
import type { ProvisioningRole } from "@/lib/types/user-management"

const ROLES: ProvisioningRole[] = [
  "admin", "collaborator", "board", "client", "shareholder", "accounting", "operations", "investor"
]

export default function ModifyUserPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { data } = useProvisionedUser(params.id)
  const modify = useModifyUser()
  const templates = useAccessTemplates()
  const user = data?.user

  const [role, setRole] = React.useState<ProvisioningRole | "">("")
  const [githubHandle, setGithubHandle] = React.useState("")
  const [templateId, setTemplateId] = React.useState("")

  React.useEffect(() => {
    if (user) {
      setRole(user.role)
      setGithubHandle(user.github_handle ?? "")
      setTemplateId(user.access_template_id ?? "")
    }
  }, [user])

  if (!user) return <div className="p-6 text-muted-foreground">Loading...</div>

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    modify.mutate(
      {
        id: params.id,
        role: role as ProvisioningRole,
        github_handle: githubHandle || undefined,
        access_template_id: templateId || undefined,
      },
      { onSuccess: () => router.push(`/admin/users/${params.id}`) }
    )
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/admin/users/${params.id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Modify — {user.name}</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Edit User</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="github">GitHub Handle</Label>
              <Input id="github" value={githubHandle} onChange={(e) => setGithubHandle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Access Template</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  {(templates.data?.templates ?? []).map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={modify.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {modify.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
