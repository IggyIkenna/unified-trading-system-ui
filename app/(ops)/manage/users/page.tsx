"use client"

import * as React from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Users, Plus, Search, Shield, Clock,
} from "lucide-react"
import { useOrganizationsList } from "@/hooks/api/use-organizations"

interface User {
  id: string
  name: string
  email: string
  org: string
  role: string
  lastLogin: string
  status: "active" | "suspended"
}

const INITIAL_USERS: User[] = [
  { id: "u-001", name: "Iggy Ikenna", email: "admin@odum.io", org: "Odum Internal", role: "admin", lastLogin: "2h ago", status: "active" },
  { id: "u-002", name: "Alex Trader", email: "trader@odum.io", org: "Odum Internal", role: "internal", lastLogin: "1h ago", status: "active" },
  { id: "u-003", name: "Sam Quant", email: "quant@odum.io", org: "Odum Internal", role: "internal", lastLogin: "3h ago", status: "active" },
  { id: "u-004", name: "Chris PM", email: "pm@alphacap.com", org: "Alpha Capital", role: "client", lastLogin: "5h ago", status: "active" },
  { id: "u-005", name: "Pat Trader", email: "trader@alphacap.com", org: "Alpha Capital", role: "client", lastLogin: "1d ago", status: "active" },
  { id: "u-006", name: "Riley Analyst", email: "analyst@betafund.com", org: "Beta Fund", role: "client", lastLogin: "2d ago", status: "active" },
  { id: "u-007", name: "Taylor CIO", email: "cio@vertex.com", org: "Vertex Partners", role: "client", lastLogin: "6h ago", status: "active" },
]

const ROLES = ["admin", "internal", "client", "viewer"]

export default function UsersManagementPage() {
  const { data: orgsData } = useOrganizationsList()
  const orgs: Array<{ id: string; name: string }> = (orgsData as { organizations?: Array<{ id: string; name: string }> })?.organizations ?? []
  const [users, setUsers] = React.useState<User[]>(INITIAL_USERS)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [orgFilter, setOrgFilter] = React.useState("all")
  const [inviteOpen, setInviteOpen] = React.useState(false)
  const [editingRoleId, setEditingRoleId] = React.useState<string | null>(null)

  // Invite form state
  const [inviteEmail, setInviteEmail] = React.useState("")
  const [inviteName, setInviteName] = React.useState("")
  const [inviteOrg, setInviteOrg] = React.useState("")
  const [inviteRole, setInviteRole] = React.useState("")

  const filteredUsers = React.useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !searchQuery ||
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesOrg = orgFilter === "all" || u.org === orgFilter
      return matchesSearch && matchesOrg
    })
  }, [users, searchQuery, orgFilter])

  const uniqueOrgs = React.useMemo(() => {
    return Array.from(new Set(users.map((u) => u.org)))
  }, [users])

  function handleInvite() {
    if (!inviteEmail || !inviteOrg || !inviteRole) {
      toast.error("Please fill all required fields")
      return
    }
    const newUser: User = {
      id: `u-${String(Date.now()).slice(-6)}`,
      name: inviteName || inviteEmail.split("@")[0],
      email: inviteEmail,
      org: inviteOrg,
      role: inviteRole,
      lastLogin: "Never",
      status: "active",
    }
    setUsers((prev) => [...prev, newUser])
    toast.success("User invited", {
      description: `${newUser.email} added to ${newUser.org}`,
    })
    setInviteEmail("")
    setInviteName("")
    setInviteOrg("")
    setInviteRole("")
    setInviteOpen(false)
  }

  function handleRoleChange(userId: string, newRole: string) {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    )
    const user = users.find((u) => u.id === userId)
    toast.success("Role updated", {
      description: `${user?.name} is now ${newRole}`,
    })
    setEditingRoleId(null)
  }

  function handleStatusToggle(userId: string) {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: u.status === "active" ? "suspended" : "active" }
          : u
      )
    )
    const user = users.find((u) => u.id === userId)
    const newStatus = user?.status === "active" ? "suspended" : "active"
    toast.success("Status updated", {
      description: `${user?.name} is now ${newStatus}`,
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="container px-4 py-6 md:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage users, roles, and access across all organizations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Users className="mr-1 size-3" />
                {users.length} users
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 py-8 md:px-6 space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={orgFilter} onValueChange={setOrgFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by org" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Organizations</SelectItem>
              {uniqueOrgs.map((org) => (
                <SelectItem key={org} value={org}>{org}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 size-4" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite User</DialogTitle>
                <DialogDescription>
                  Send an invitation to a new user. They will receive access to the selected organization.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    placeholder="Full name"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Email <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Organization <span className="text-destructive">*</span>
                  </label>
                  <Select value={inviteOrg} onValueChange={setInviteOrg}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {orgs.map((o) => (
                        <SelectItem key={o.id} value={o.name}>{o.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Role <span className="text-destructive">*</span>
                  </label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInvite}>
                  Send Invitation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* User Table */}
        <Card>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {user.org}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {editingRoleId === user.id ? (
                        <Select
                          value={user.role}
                          onValueChange={(val) => handleRoleChange(user.id, val)}
                        >
                          <SelectTrigger className="w-[120px] h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((r) => (
                              <SelectItem key={r} value={r} className="capitalize text-xs">
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <button
                          onClick={() => setEditingRoleId(user.id)}
                          className="inline-flex items-center gap-1 text-sm hover:text-sky-400 transition-colors cursor-pointer"
                          title="Click to change role"
                        >
                          <Shield className="size-3" />
                          <span className="capitalize">{user.role}</span>
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" />
                        {user.lastLogin}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          user.status === "active"
                            ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                            : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        }
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusToggle(user.id)}
                        className="text-xs"
                      >
                        {user.status === "active" ? "Suspend" : "Activate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No users found matching your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
