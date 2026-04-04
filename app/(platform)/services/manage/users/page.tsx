"use client";

import { PageHeader } from "@/components/shared/page-header";
import * as React from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportDropdown } from "@/components/shared/export-dropdown";
import { Users, Plus, Search, Shield, Clock, UserPlus, ArrowRight } from "lucide-react";
import { useOrganizationsList, useOrgMembers } from "@/hooks/api/use-organizations";
import { ApiError } from "@/components/shared/api-error";
import { EmptyState } from "@/components/shared/empty-state";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";

interface User {
  id: string;
  name: string;
  email: string;
  org: string;
  role: string;
  lastLogin: string;
  status: "active" | "suspended";
}

const ROLES = ["admin", "internal", "client", "viewer"];

export default function UsersManagementPage() {
  const { isAdmin } = useAuth();
  const {
    data: orgsData,
    isLoading: orgsLoading,
    isError: orgsIsError,
    error: orgsError,
    refetch: refetchOrgs,
  } = useOrganizationsList();
  const orgs: Array<{ id: string; name: string }> = (orgsData as any)?.data ?? (orgsData as any)?.organizations ?? [];
  const {
    data: membersData,
    isLoading: membersLoading,
    isError: membersIsError,
    error: membersError,
    refetch: refetchMembers,
  } = useOrgMembers("all");

  const apiUsers: User[] = ((membersData as any)?.data ?? []).map((m: any) => ({
    id: m.id ?? "",
    name: m.name ?? "",
    email: m.email ?? "",
    org: m.org ?? m.organization ?? "",
    role: m.role ?? "viewer",
    lastLogin: m.lastLogin ?? "Never",
    status: (m.status ?? "active") as "active" | "suspended",
  }));

  const [users, setUsers] = React.useState<User[]>([]);

  // Sync API data into local state for mutation
  React.useEffect(() => {
    if (apiUsers.length > 0 && users.length === 0) setUsers(apiUsers);
  }, [apiUsers.length]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [orgFilter, setOrgFilter] = React.useState("all");
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [editingRoleId, setEditingRoleId] = React.useState<string | null>(null);

  // Invite form state
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteName, setInviteName] = React.useState("");
  const [inviteOrg, setInviteOrg] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState("");

  const filteredUsers = React.useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !searchQuery ||
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesOrg = orgFilter === "all" || u.org === orgFilter;
      return matchesSearch && matchesOrg;
    });
  }, [users, searchQuery, orgFilter]);

  const uniqueOrgs = React.useMemo(() => {
    return Array.from(new Set(users.map((u) => u.org)));
  }, [users]);

  function handleInvite() {
    if (!inviteEmail || !inviteOrg || !inviteRole) {
      toast.error("Please fill all required fields");
      return;
    }
    const newUser: User = {
      id: `u-${String(Date.now()).slice(-6)}`,
      name: inviteName || inviteEmail.split("@")[0],
      email: inviteEmail,
      org: inviteOrg,
      role: inviteRole,
      lastLogin: "Never",
      status: "active",
    };
    setUsers((prev) => [...prev, newUser]);
    toast.success("User invited", {
      description: `${newUser.email} added to ${newUser.org}`,
    });
    setInviteEmail("");
    setInviteName("");
    setInviteOrg("");
    setInviteRole("");
    setInviteOpen(false);
  }

  function handleRoleChange(userId: string, newRole: string) {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    const user = users.find((u) => u.id === userId);
    toast.success("Role updated", {
      description: `${user?.name} is now ${newRole}`,
    });
    setEditingRoleId(null);
  }

  function handleStatusToggle(userId: string) {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: u.status === "active" ? "suspended" : "active" } : u)),
    );
    const user = users.find((u) => u.id === userId);
    const newStatus = user?.status === "active" ? "suspended" : "active";
    toast.success("Status updated", {
      description: `${user?.name} is now ${newStatus}`,
    });
  }

  if (orgsLoading || membersLoading)
    return (
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="pt-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </main>
    );

  const listError = (orgsError ?? membersError) as Error | null;
  if ((orgsIsError || membersIsError) && listError) {
    return (
      <div className="p-6">
        <ApiError
          error={listError}
          onRetry={() => {
            void refetchOrgs();
            void refetchMembers();
          }}
          title="Failed to load users"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {isAdmin() && (
        <div className="bg-primary/5 border-b border-primary/10 px-6 py-2 flex items-center gap-2 text-sm">
          <Shield className="size-4 text-primary" />
          <span>Admin — full provisioning management available</span>
          <Link href="/admin/users" className="ml-auto flex items-center gap-1 text-primary hover:underline text-xs font-medium">
            Open Admin Console <ArrowRight className="size-3" />
          </Link>
        </div>
      )}
      <div className="border-b border-border">
        <div className="container px-4 py-6 md:px-6">
          <div className="flex items-center justify-between">
            <PageHeader
              title="User Management"
              description={isAdmin() ? "Read-only directory — use the Admin Console for full management." : "Manage users, roles, and access across all organizations"}
            />
            <div className="flex items-center gap-2">
              <ExportDropdown
                data={filteredUsers.map((u) => ({
                  name: u.name,
                  email: u.email,
                  org: u.org,
                  role: u.role,
                  lastLogin: u.lastLogin,
                  status: u.status,
                }))}
                columns={[
                  { key: "name", header: "Name" },
                  { key: "email", header: "Email" },
                  { key: "org", header: "Organization" },
                  { key: "role", header: "Role" },
                  { key: "lastLogin", header: "Last Login" },
                  { key: "status", header: "Status" },
                ]}
                filename="users"
              />
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
                <SelectItem key={org} value={org}>
                  {org}
                </SelectItem>
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
                  <Input placeholder="Full name" value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
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
                        <SelectItem key={o.id} value={o.name}>
                          {o.name}
                        </SelectItem>
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
                        <SelectItem key={r} value={r} className="capitalize">
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInvite}>Send Invitation</Button>
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
                        <Select value={user.role} onValueChange={(val) => handleRoleChange(user.id, val)}>
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
                      <Button variant="ghost" size="sm" onClick={() => handleStatusToggle(user.id)} className="text-xs">
                        {user.status === "active" ? "Suspend" : "Activate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="p-6">
                      <EmptyState
                        icon={UserPlus}
                        title="No users found"
                        description={
                          searchQuery || orgFilter !== "all"
                            ? "Try adjusting your filters."
                            : "Add your first team member to get started."
                        }
                        action={
                          !searchQuery && orgFilter === "all"
                            ? { label: "Add user", onClick: () => setInviteOpen(true) }
                            : undefined
                        }
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
